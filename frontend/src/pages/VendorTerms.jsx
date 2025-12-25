import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Helmet } from 'react-helmet-async';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

const VendorTerms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Vendor Terms & Conditions | rayy</title>
        <meta name="description" content="Partner terms and conditions for rayy marketplace" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 24px 60px' }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
            borderRadius: '16px',
            padding: '40px',
            marginBottom: '40px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <FileText size={40} />
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>
                Vendor Terms & Conditions
              </h1>
            </div>
            <p style={{ fontSize: '1.1rem', opacity: 0.95, margin: 0 }}>
              rayy Partner Agreement
            </p>
            <p style={{ fontSize: '0.95rem', opacity: 0.8, marginTop: '12px' }}>
              <strong>Version:</strong> 1.0 | <strong>Effective Date:</strong> November 6, 2024
            </p>
          </div>

          {/* Content */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            {/* Introduction */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>1. Introduction</h2>
              <p style={{ lineHeight: '1.8', color: '#475569', marginBottom: '12px' }}>
                These Vendor Terms and Conditions ("Agreement") govern the relationship between rayy ("Platform," "we," "us," or "our") 
                and educational service providers, instructors, tutors, and organizations ("Partner," "Vendor," "you," or "your") 
                who list and offer classes, workshops, camps, and activities through the rayy marketplace.
              </p>
              <p style={{ lineHeight: '1.8', color: '#475569' }}>
                By registering as a Partner on rayy, you acknowledge that you have read, understood, and agree to be bound by these terms.
              </p>
            </section>

            {/* Commission Structure */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>2. Commission Structure</h2>
              
              <div style={{ 
                background: '#f0f9ff', 
                border: '2px solid #06B6D4', 
                borderRadius: '12px', 
                padding: '24px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <CheckCircle size={24} color="#06B6D4" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0891B2', marginBottom: '8px' }}>
                      Promotional Period (First 30 Days)
                    </h3>
                    <p style={{ lineHeight: '1.8', color: '#475569', margin: 0 }}>
                      <strong>0% Commission</strong> - For the first 30 days from the date of your account approval, 
                      rayy will not charge any commission on bookings made through the platform.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ 
                background: '#fff7ed', 
                border: '2px solid #F59E0B', 
                borderRadius: '12px', 
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <AlertCircle size={24} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#D97706', marginBottom: '8px' }}>
                      Standard Commission (After 30 Days)
                    </h3>
                    <p style={{ lineHeight: '1.8', color: '#475569', margin: 0 }}>
                      <strong>10% Commission</strong> - From day 31 onwards, rayy will charge a 10% commission 
                      on all successful bookings made through the platform.
                    </p>
                  </div>
                </div>
              </div>

              <ul style={{ marginTop: '20px', lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li>Commission is calculated on the booking amount paid by customers</li>
                <li>Commission is automatically deducted before payout to partners</li>
                <li>GST/taxes (if applicable) will be added to the commission amount</li>
                <li>No hidden fees or additional charges beyond stated commission</li>
              </ul>
            </section>

            {/* Trial Listings */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>3. Trial Classes & Listings</h2>
              <p style={{ lineHeight: '1.8', color: '#475569', marginBottom: '12px' }}>
                Partners are encouraged to offer trial classes to attract new customers:
              </p>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li><strong>Trial Pricing:</strong> Partners set their own trial class prices</li>
                <li><strong>Promotional Feature:</strong> Trial classes get prominent placement on the platform</li>
                <li><strong>Commission Applies:</strong> Standard commission structure applies to trial bookings</li>
                <li><strong>Quality Standards:</strong> Trial classes must meet the same quality standards as regular classes</li>
                <li><strong>No Obligation:</strong> Customers are not required to book full courses after trial</li>
              </ul>
            </section>

            {/* Payout Cycle */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>4. Payout Cycle & Process</h2>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li><strong>Payout Frequency:</strong> Bi-weekly (every 2 weeks) or as mutually agreed</li>
                <li><strong>Payout Method:</strong> Direct bank transfer to your registered account</li>
                <li><strong>Processing Time:</strong> 3-5 business days from payout initiation</li>
                <li><strong>Minimum Threshold:</strong> ₹1,000 minimum payout amount</li>
                <li><strong>Withheld Amount:</strong> 10% of earnings held for 30 days as refund reserve</li>
                <li><strong>Invoice Required:</strong> Partners must provide valid invoices for payments</li>
                <li><strong>Tax Compliance:</strong> Partners responsible for their own tax filings</li>
              </ul>
            </section>

            {/* Cancellation Policy */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>5. Cancellation & Refund Rules</h2>
              
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0f172a', marginTop: '20px', marginBottom: '12px' }}>
                5.1 Partner-Initiated Cancellations
              </h3>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px', marginBottom: '16px' }}>
                <li><strong>24+ Hours Notice:</strong> Full refund to customer, no penalty to partner</li>
                <li><strong>Less than 24 Hours:</strong> Full refund to customer, partner responsible for commission paid</li>
                <li><strong>No-Show by Partner:</strong> Full refund + penalty of ₹500 or 50% of booking amount (whichever is higher)</li>
                <li><strong>Frequent Cancellations:</strong> May result in account suspension or termination</li>
              </ul>

              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0f172a', marginTop: '20px', marginBottom: '12px' }}>
                5.2 Customer-Initiated Cancellations
              </h3>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li><strong>48+ Hours Before:</strong> Full refund to customer, partner retains commission-free amount</li>
                <li><strong>24-48 Hours Before:</strong> 50% refund to customer, partner retains 50% (minus commission)</li>
                <li><strong>Less than 24 Hours:</strong> No refund to customer, partner retains full amount (minus commission)</li>
                <li><strong>No-Show by Customer:</strong> Partner retains full payment (minus commission)</li>
              </ul>
            </section>

            {/* Credit System */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>6. Credit System (Future Feature)</h2>
              <p style={{ lineHeight: '1.8', color: '#475569', marginBottom: '12px' }}>
                rayy may introduce a credit-based system for partners in the future:
              </p>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li>Partners may receive credits for promotional purposes</li>
                <li>Credits can be used to boost listings or run promotions</li>
                <li>Credits expire after 90 days from issuance (unless specified otherwise)</li>
                <li>Credits are non-transferable and non-refundable</li>
                <li>Terms will be updated when feature is launched</li>
              </ul>
            </section>

            {/* Quality Standards */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>7. Quality Expectations & Standards</h2>
              <p style={{ lineHeight: '1.8', color: '#475569', marginBottom: '12px' }}>
                Partners must maintain high-quality standards:
              </p>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li><strong>Accurate Information:</strong> All class descriptions, timings, and pricing must be accurate</li>
                <li><strong>Professional Conduct:</strong> Maintain professional behavior with all customers</li>
                <li><strong>Safety Compliance:</strong> Ensure all activities meet safety standards and regulations</li>
                <li><strong>Age-Appropriate:</strong> Content must be suitable for the specified age groups</li>
                <li><strong>Qualified Instructors:</strong> Instructors must have appropriate qualifications and experience</li>
                <li><strong>Clean Facilities:</strong> Physical venues must be clean, safe, and well-maintained</li>
                <li><strong>Response Time:</strong> Respond to customer queries within 24 hours</li>
                <li><strong>Minimum Rating:</strong> Maintain minimum 3.5-star average rating</li>
              </ul>
            </section>

            {/* Customer Handling */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>8. Customer Interaction & Handling</h2>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li><strong>Professionalism:</strong> Always maintain courteous and professional communication</li>
                <li><strong>No Direct Payments:</strong> All payments must be processed through rayy platform</li>
                <li><strong>Privacy:</strong> Respect customer privacy and data protection</li>
                <li><strong>Dispute Resolution:</strong> Cooperate with rayy in resolving customer disputes</li>
                <li><strong>Feedback:</strong> Accept and respond to customer feedback constructively</li>
                <li><strong>No Solicitation:</strong> Do not solicit customers to book outside the platform</li>
              </ul>
            </section>

            {/* SLA Expectations */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>9. Service Level Agreement (SLA)</h2>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li><strong>Listing Approval:</strong> rayy will review and approve listings within 48 hours</li>
                <li><strong>Payout Processing:</strong> Payouts initiated within 3 business days of payout cycle</li>
                <li><strong>Support Response:</strong> Partner queries answered within 24-48 hours</li>
                <li><strong>Platform Uptime:</strong> 99.5% platform availability (excluding maintenance)</li>
                <li><strong>Dispute Resolution:</strong> Disputes addressed within 7 business days</li>
              </ul>
            </section>

            {/* Content Rights */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>10. Content Rights & Usage</h2>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li><strong>Content Ownership:</strong> You retain ownership of all content you upload</li>
                <li><strong>License to rayy:</strong> You grant rayy non-exclusive rights to use your content for platform operations and marketing</li>
                <li><strong>Accuracy:</strong> You are responsible for accuracy of all content provided</li>
                <li><strong>Copyright:</strong> You confirm you have rights to all content uploaded</li>
                <li><strong>Removal Rights:</strong> rayy may remove content that violates policies</li>
                <li><strong>Marketing Usage:</strong> rayy may feature your classes in marketing materials</li>
              </ul>
            </section>

            {/* Liability */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>11. Liability & Indemnity</h2>
              
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0f172a', marginTop: '20px', marginBottom: '12px' }}>
                11.1 Partner Liability
              </h3>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px', marginBottom: '16px' }}>
                <li>Partners are solely responsible for the quality and safety of classes</li>
                <li>Partners must have appropriate insurance coverage</li>
                <li>Partners liable for any injuries, damages, or losses during classes</li>
                <li>Partners must comply with all local laws and regulations</li>
              </ul>

              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0f172a', marginTop: '20px', marginBottom: '12px' }}>
                11.2 Platform Liability
              </h3>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px', marginBottom: '16px' }}>
                <li>rayy acts as a marketplace platform only</li>
                <li>rayy is not responsible for partner actions or class quality</li>
                <li>rayy liability limited to platform-related technical issues</li>
                <li>Maximum liability capped at commission earned in past 3 months</li>
              </ul>

              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0f172a', marginTop: '20px', marginBottom: '12px' }}>
                11.3 Indemnification
              </h3>
              <p style={{ lineHeight: '1.8', color: '#475569' }}>
                Partner agrees to indemnify and hold harmless rayy from any claims, damages, or expenses arising from:
              </p>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li>Partner's breach of these terms</li>
                <li>Partner's violation of laws or regulations</li>
                <li>Injuries or damages during partner's classes</li>
                <li>Intellectual property infringement claims</li>
                <li>Partner's negligence or misconduct</li>
              </ul>
            </section>

            {/* Termination */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>12. Termination Clauses</h2>
              
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0f172a', marginTop: '20px', marginBottom: '12px' }}>
                12.1 Termination by Partner
              </h3>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px', marginBottom: '16px' }}>
                <li><strong>Notice Period:</strong> 30 days written notice required</li>
                <li><strong>Pending Bookings:</strong> Must honor all confirmed bookings</li>
                <li><strong>Final Payout:</strong> Processed after 30-day refund reserve period</li>
                <li><strong>Data:</strong> Account data deleted 90 days after termination</li>
              </ul>

              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0f172a', marginTop: '20px', marginBottom: '12px' }}>
                12.2 Termination by rayy
              </h3>
              <p style={{ lineHeight: '1.8', color: '#475569', marginBottom: '12px' }}>
                rayy may terminate partnership immediately for:
              </p>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px', marginBottom: '16px' }}>
                <li>Violation of these terms and conditions</li>
                <li>Fraudulent activity or misrepresentation</li>
                <li>Repeated customer complaints or poor ratings (below 3.0)</li>
                <li>Failure to comply with legal requirements</li>
                <li>Safety incidents or negligence</li>
                <li>Non-payment of dues or fees</li>
                <li>Inactive account (no bookings for 6 months)</li>
              </ul>

              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#0f172a', marginTop: '20px', marginBottom: '12px' }}>
                12.3 Post-Termination
              </h3>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li>All listings will be removed from the platform</li>
                <li>Access to partner dashboard will be revoked</li>
                <li>Outstanding payouts settled within 45 days</li>
                <li>Confidentiality obligations continue post-termination</li>
              </ul>
            </section>

            {/* Modification */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>13. Modification of Terms</h2>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li>rayy may modify these terms at any time</li>
                <li>Partners will be notified 30 days before changes take effect</li>
                <li>Continued use of platform constitutes acceptance of new terms</li>
                <li>Material changes require explicit re-acceptance</li>
                <li>Previous terms apply to bookings made before modification</li>
              </ul>
            </section>

            {/* Governing Law */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>14. Governing Law & Jurisdiction</h2>
              <ul style={{ lineHeight: '1.8', color: '#475569', paddingLeft: '24px' }}>
                <li><strong>Governing Law:</strong> These terms governed by laws of India</li>
                <li><strong>Jurisdiction:</strong> Courts of Bangalore, Karnataka have exclusive jurisdiction</li>
                <li><strong>Dispute Resolution:</strong> Mediation preferred before legal action</li>
                <li><strong>Arbitration:</strong> Disputes may be resolved through arbitration</li>
              </ul>
            </section>

            {/* Contact */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#06B6D4', fontSize: '1.8rem', marginBottom: '16px' }}>15. Contact Information</h2>
              <div style={{ 
                background: '#f8fafc', 
                borderRadius: '12px', 
                padding: '24px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ lineHeight: '1.8', color: '#475569', marginBottom: '12px' }}>
                  For questions or concerns regarding these terms:
                </p>
                <p style={{ lineHeight: '1.8', color: '#0f172a', margin: 0 }}>
                  <strong>Email:</strong> partners@rrray.com<br />
                  <strong>Phone:</strong> +91 (XXX) XXX-XXXX<br />
                  <strong>Address:</strong> rayy Headquarters, Bangalore, Karnataka, India
                </p>
              </div>
            </section>

            {/* Acceptance */}
            <section style={{
              background: '#f0f9ff',
              borderLeft: '4px solid #06B6D4',
              borderRadius: '8px',
              padding: '24px',
              marginTop: '40px'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0891B2', marginBottom: '12px' }}>
                Acceptance of Terms
              </h3>
              <p style={{ lineHeight: '1.8', color: '#475569', margin: 0 }}>
                By completing the partner registration process and checking the acceptance box, you acknowledge that you have read, 
                understood, and agree to be bound by these Vendor Terms and Conditions. Your digital acceptance, along with timestamp 
                and IP address, will be recorded for legal compliance.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '40px', color: '#64748b', fontSize: '0.9rem' }}>
            <p>
              © 2024 rayy. All rights reserved. | Version 1.0 | Last Updated: November 6, 2024
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorTerms;
