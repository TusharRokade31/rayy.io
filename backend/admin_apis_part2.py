"""
YUNO Admin Panel - Financials, Reports, Config APIs
Continuation of admin_apis.py
"""

# ============== FINANCIALS & PAYOUTS ==============

@admin_router.get("/payouts")
async def get_payouts(
    period: Optional[str] = None,
    partner_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get payout statements"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if period:
        # Format: YYYY-WW (e.g., 2025-42)
        year, week = map(int, period.split('-'))
        # Calculate start and end of week
        # Simplified: use first day of year + weeks
        period_start = datetime(year, 1, 1, tzinfo=timezone.utc) + timedelta(weeks=week-1)
        period_end = period_start + timedelta(days=7)
        query["period_start"] = {"$gte": period_start, "$lt": period_end}
    
    if partner_id:
        query["partner_id"] = partner_id
    
    if status:
        query["status"] = status
    
    statements = await db.payout_statements.find(query, {"_id": 0}).sort("period_start", -1).to_list(100)
    
    return {"statements": statements}

@admin_router.post("/payouts/generate")
async def generate_payouts(
    request: PayoutGenerateRequest,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Generate payout statements for period"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    partners = await db.partners.find({}, {"_id": 0}).to_list(1000)
    
    statements = []
    for partner in partners:
        # Get listings
        listings = await db.listings.find({"partner_id": partner["id"]}, {"_id": 0}).to_list(100)
        listing_ids = [l["id"] for l in listings]
        
        # Get bookings in period
        bookings = await db.bookings.find({
            "listing_id": {"$in": listing_ids},
            "booked_at": {"$gte": request.period_start, "$lt": request.period_end},
            "booking_status": {"$in": ["confirmed", "attended"]}
        }, {"_id": 0}).to_list(10000)
        
        if not bookings:
            continue
        
        gross = sum(b.get("total_inr", 0) for b in bookings)
        credits_equivalent = sum(b.get("credits_used", 0) * 20 for b in bookings)  # 1 credit = ₹20
        
        # Commission
        fees = gross * 0.15
        
        # Refunds
        refunds = await db.bookings.find({
            "listing_id": {"$in": listing_ids},
            "canceled_at": {"$gte": request.period_start, "$lt": request.period_end},
            "booking_status": "refunded"
        }, {"_id": 0}).to_list(10000)
        
        refund_amount = sum(r.get("refund_amount_inr", 0) for r in refunds)
        
        net = gross - fees - refund_amount
        
        statement = {
            "id": str(uuid.uuid4()),
            "partner_id": partner["id"],
            "partner_name": partner["brand_name"],
            "period_start": request.period_start,
            "period_end": request.period_end,
            "gross_inr": gross,
            "credits_equivalent": credits_equivalent,
            "fees_inr": fees,
            "refunds_inr": refund_amount,
            "net_inr": net,
            "bookings_count": len(bookings),
            "cancellations_count": len(refunds),
            "status": "draft",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.payout_statements.insert_one(statement)
        statements.append(statement)
    
    await log_audit(db, current_user["id"], "payout.generate", "payout", "batch", {}, {"count": len(statements)})
    
    return {"message": f"Generated {len(statements)} statements", "statements": statements}

@admin_router.post("/payouts/{statement_id}/lock")
async def lock_payout(
    statement_id: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Lock payout statement"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    statement = await db.payout_statements.find_one({"id": statement_id}, {"_id": 0})
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    if statement["status"] != "draft":
        raise HTTPException(status_code=400, detail="Can only lock draft statements")
    
    before = statement.copy()
    
    await db.payout_statements.update_one(
        {"id": statement_id},
        {"$set": {"status": "locked", "updated_at": datetime.now(timezone.utc)}}
    )
    
    after = await db.payout_statements.find_one({"id": statement_id}, {"_id": 0})
    await log_audit(db, current_user["id"], "payout.lock", "payout", statement_id, before, after)
    
    return {"message": "Statement locked"}

@admin_router.post("/payouts/{statement_id}/mark-paid")
async def mark_payout_paid(
    statement_id: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Mark payout as paid"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    statement = await db.payout_statements.find_one({"id": statement_id}, {"_id": 0})
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    if statement["status"] != "locked":
        raise HTTPException(status_code=400, detail="Can only mark locked statements as paid")
    
    before = statement.copy()
    
    await db.payout_statements.update_one(
        {"id": statement_id},
        {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}}
    )
    
    after = await db.payout_statements.find_one({"id": statement_id}, {"_id": 0})
    await log_audit(db, current_user["id"], "payout.mark_paid", "payout", statement_id, before, after)
    
    return {"message": "Statement marked as paid"}

@admin_router.get("/payouts/{statement_id}/export.csv")
async def export_payout_csv(
    statement_id: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Export payout statement as CSV"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    statement = await db.payout_statements.find_one({"id": statement_id}, {"_id": 0})
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "partner_id", "partner_name", "period_start", "period_end",
        "gross_inr", "fees_inr", "refunds_inr", "net_inr",
        "bookings_count", "cancellations_count", "status", "generated_at"
    ])
    
    # Data
    writer.writerow([
        statement["partner_id"],
        statement["partner_name"],
        statement["period_start"].isoformat(),
        statement["period_end"].isoformat(),
        statement["gross_inr"],
        statement["fees_inr"],
        statement["refunds_inr"],
        statement["net_inr"],
        statement["bookings_count"],
        statement["cancellations_count"],
        statement["status"],
        statement["created_at"].isoformat()
    ])
    
    csv_content = output.getvalue()
    output.close()
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=payout_{statement_id}.csv"}
    )

# ============== CONFIG MANAGEMENT ==============

@admin_router.get("/configs/{key}")
async def get_config(
    key: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get config by key"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    config = await db.configs.find_one({"_id": key}, {"_id": 0})
    if not config:
        # Return defaults
        if key == "credit_plans":
            return {"value": await db.credit_plans.find({}, {"_id": 0}).to_list(100)}
        elif key == "cancellation_policy_default":
            return {"value": {"windows": [
                {"min_hours": 6, "max_hours": 9999, "refund_pct": 100},
                {"min_hours": 2, "max_hours": 6, "refund_pct": 50},
                {"min_hours": 0, "max_hours": 2, "refund_pct": 0}
            ]}}
        elif key == "commission":
            return {"value": {"standard_pct": 0.15, "subscriber_pct": 0.10}}
        else:
            raise HTTPException(status_code=404, detail="Config not found")
    
    return config

@admin_router.post("/configs/{key}")
async def update_config(
    key: str,
    request: ConfigUpdateRequest,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update config"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    before = await db.configs.find_one({"_id": key}, {"_id": 0})
    
    await db.configs.update_one(
        {"_id": key},
        {
            "$set": {
                "value": request.value,
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    after = await db.configs.find_one({"_id": key}, {"_id": 0})
    await log_audit(db, current_user["id"], "config.update", "config", key, before or {}, after)
    
    return {"message": f"Config {key} updated"}

# ============== REPORTS ==============

@admin_router.get("/reports/fill-rate")
async def get_fill_rate_report(
    from_date: str,
    to_date: str,
    partner_id: Optional[str] = None,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get fill rate report"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    start = datetime.fromisoformat(from_date)
    end = datetime.fromisoformat(to_date)
    
    query = {
        "start_at": {"$gte": start, "$lt": end}
    }
    
    if partner_id:
        listings = await db.listings.find({"partner_id": partner_id}, {"_id": 0}).to_list(100)
        listing_ids = [l["id"] for l in listings]
        query["listing_id"] = {"$in": listing_ids}
    
    sessions = await db.sessions.find(query, {"_id": 0}).to_list(10000)
    
    # Calculate fill rate per partner
    partner_fill_rates = {}
    
    for session in sessions:
        listing = await db.listings.find_one({"id": session["listing_id"]}, {"_id": 0})
        if not listing:
            continue
        
        pid = listing["partner_id"]
        if pid not in partner_fill_rates:
            partner_fill_rates[pid] = {"total_seats": 0, "reserved_seats": 0, "sessions": 0}
        
        partner_fill_rates[pid]["total_seats"] += session["seats_total"]
        partner_fill_rates[pid]["reserved_seats"] += session["seats_reserved"]
        partner_fill_rates[pid]["sessions"] += 1
    
    # Enrich with partner names
    result = []
    for pid, stats in partner_fill_rates.items():
        partner = await db.partners.find_one({"id": pid}, {"_id": 0})
        fill_rate = (stats["reserved_seats"] / stats["total_seats"] * 100) if stats["total_seats"] > 0 else 0
        
        result.append({
            "partner_id": pid,
            "partner_name": partner["brand_name"] if partner else "Unknown",
            "sessions": stats["sessions"],
            "total_seats": stats["total_seats"],
            "reserved_seats": stats["reserved_seats"],
            "fill_rate_pct": round(fill_rate, 1)
        })
    
    return {"fill_rates": sorted(result, key=lambda x: x["fill_rate_pct"], reverse=True)}

@admin_router.get("/reports/cancellations")
async def get_cancellations_report(
    from_date: str,
    to_date: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get cancellation reasons report"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    start = datetime.fromisoformat(from_date)
    end = datetime.fromisoformat(to_date)
    
    cancellations = await db.bookings.find({
        "booking_status": "canceled",
        "canceled_at": {"$gte": start, "$lt": end}
    }, {"_id": 0}).to_list(10000)
    
    # Group by reason
    reasons = {}
    for cancel in cancellations:
        reason = cancel.get("cancellation_reason", "No reason provided")
        reasons[reason] = reasons.get(reason, 0) + 1
    
    result = [{"reason": k, "count": v} for k, v in reasons.items()]
    
    return {"cancellations": sorted(result, key=lambda x: x["count"], reverse=True)}

@admin_router.get("/reports/credits-usage")
async def get_credits_usage_report(
    from_date: str,
    to_date: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get credits usage report"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    start = datetime.fromisoformat(from_date)
    end = datetime.fromisoformat(to_date)
    
    # Credits used by plan (simplified - tracking all credit bookings)
    bookings = await db.bookings.find({
        "booked_at": {"$gte": start, "$lt": end},
        "credits_used": {"$gt": 0}
    }, {"_id": 0}).to_list(10000)
    
    total_credits_used = sum(b.get("credits_used", 0) for b in bookings)
    
    # Trial to paid conversion
    trials = await db.bookings.find({
        "booked_at": {"$gte": start, "$lt": end},
        "unit_price_inr": {"$lte": 300}  # Assuming trials are <= 300
    }, {"_id": 0}).to_list(10000)
    
    # Get subsequent bookings for trial users
    trial_users = list(set([t["user_id"] for t in trials]))
    
    paid_conversions = 0
    for user_id in trial_users:
        paid = await db.bookings.count_documents({
            "user_id": user_id,
            "booked_at": {"$gte": start, "$lt": end},
            "unit_price_inr": {"$gt": 300}
        })
        if paid > 0:
            paid_conversions += 1
    
    conversion_rate = (paid_conversions / len(trial_users) * 100) if trial_users else 0
    
    return {
        "total_credits_used": total_credits_used,
        "credits_bookings": len(bookings),
        "trials": len(trials),
        "trial_to_paid_conversions": paid_conversions,
        "conversion_rate_pct": round(conversion_rate, 1)
    }

@admin_router.get("/reports/revenue-mix")
async def get_revenue_mix_report(
    from_date: str,
    to_date: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get revenue mix report"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    start = datetime.fromisoformat(from_date)
    end = datetime.fromisoformat(to_date)
    
    bookings = await db.bookings.find({
        "booked_at": {"$gte": start, "$lt": end},
        "booking_status": {"$in": ["confirmed", "attended"]}
    }, {"_id": 0}).to_list(10000)
    
    inr_revenue = sum(b.get("total_inr", 0) for b in bookings if b.get("credits_used", 0) == 0)
    credits_equivalent = sum(b.get("credits_used", 0) * 20 for b in bookings if b.get("credits_used", 0) > 0)
    
    total = inr_revenue + credits_equivalent
    inr_pct = (inr_revenue / total * 100) if total > 0 else 0
    credits_pct = (credits_equivalent / total * 100) if total > 0 else 0
    
    return {
        "inr_revenue": inr_revenue,
        "credits_equivalent": credits_equivalent,
        "total_revenue": total,
        "inr_percentage": round(inr_pct, 1),
        "credits_percentage": round(credits_pct, 1)
    }

# ============== AUDIT LOGS ==============

@admin_router.get("/audit")
async def get_audit_logs(
    action: Optional[str] = None,
    entity: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get audit logs"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if action:
        query["action"] = action
    if entity:
        query["entity"] = entity
    if from_date and to_date:
        start = datetime.fromisoformat(from_date)
        end = datetime.fromisoformat(to_date)
        query["at"] = {"$gte": start, "$lt": end}
    
    skip = (page - 1) * limit
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with actor names
    for log in logs:
        actor = await db.users.find_one({"id": log["actor_user_id"]}, {"_id": 0})
        if actor:
            log["actor_name"] = actor["name"]
    
    total = await db.audit_logs.count_documents(query)
    
    return {
        "logs": logs,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }
