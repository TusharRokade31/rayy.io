#!/usr/bin/env python3
"""
Generate dynamic sitemap.xml with all listings
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from dotenv import load_dotenv
import xml.etree.ElementTree as ET
from xml.dom import minidom

load_dotenv()

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

BASE_URL = "http://localhost:3000"

async def generate_sitemap():
    """Generate comprehensive sitemap.xml"""
    
    # Create root element
    urlset = ET.Element('urlset')
    urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    urlset.set('xmlns:image', 'http://www.google.com/schemas/sitemap-image/1.1')
    urlset.set('xmlns:news', 'http://www.google.com/schemas/sitemap-news/0.9')
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Static pages with priorities
    static_pages = [
        {'loc': '/', 'priority': '1.0', 'changefreq': 'daily'},
        {'loc': '/search', 'priority': '0.9', 'changefreq': 'daily'},
        {'loc': '/search?trial=true', 'priority': '0.9', 'changefreq': 'daily'},
        {'loc': '/partner-landing', 'priority': '0.8', 'changefreq': 'weekly'},
        {'loc': '/list-studio', 'priority': '0.7', 'changefreq': 'weekly'},
        {'loc': '/about', 'priority': '0.6', 'changefreq': 'monthly'},
        {'loc': '/careers', 'priority': '0.5', 'changefreq': 'monthly'},
        {'loc': '/help-center', 'priority': '0.6', 'changefreq': 'weekly'},
        {'loc': '/safety', 'priority': '0.6', 'changefreq': 'monthly'},
        {'loc': '/privacy', 'priority': '0.5', 'changefreq': 'monthly'},
        {'loc': '/terms', 'priority': '0.5', 'changefreq': 'monthly'},
        {'loc': '/support', 'priority': '0.6', 'changefreq': 'monthly'},
        {'loc': '/faq', 'priority': '0.6', 'changefreq': 'monthly'},
    ]
    
    # Category pages
    categories = ['dance', 'art', 'coding', 'sports', 'music', 'life-skills', 'swimming', 'chess', 'robotics', 'drama', 'fitness', 'martial_arts']
    for cat in categories:
        static_pages.append({
            'loc': f'/search?category={cat}',
            'priority': '0.8',
            'changefreq': 'daily'
        })
    
    # Add static pages
    for page in static_pages:
        url = ET.SubElement(urlset, 'url')
        loc = ET.SubElement(url, 'loc')
        loc.text = BASE_URL + page['loc']
        lastmod = ET.SubElement(url, 'lastmod')
        lastmod.text = today
        changefreq = ET.SubElement(url, 'changefreq')
        changefreq.text = page['changefreq']
        priority = ET.SubElement(url, 'priority')
        priority.text = page['priority']
    
    # Get all active listings
    listings = await db.listings.find(
        {'status': 'active'},
        {'id': 1, 'title': 1, 'updated_at': 1, 'images': 1}
    ).to_list(1000)
    
    print(f"Adding {len(listings)} listings to sitemap...")
    
    # Add listing pages
    for listing in listings:
        url = ET.SubElement(urlset, 'url')
        loc = ET.SubElement(url, 'loc')
        loc.text = f"{BASE_URL}/listings/{listing['id']}"
        
        lastmod = ET.SubElement(url, 'lastmod')
        updated = listing.get('updated_at', today)
        if isinstance(updated, str):
            lastmod.text = updated[:10]  # Get YYYY-MM-DD
        else:
            lastmod.text = today
        
        changefreq = ET.SubElement(url, 'changefreq')
        changefreq.text = 'weekly'
        
        priority = ET.SubElement(url, 'priority')
        priority.text = '0.7'
        
        # Add image if available
        if listing.get('images') and len(listing['images']) > 0:
            image = ET.SubElement(url, 'image:image', attrib={'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1'})
            image_loc = ET.SubElement(image, 'image:loc')
            image_loc.text = listing['images'][0]
            image_title = ET.SubElement(image, 'image:title')
            image_title.text = listing.get('title', 'Class')
    
    # Pretty print XML
    xml_string = ET.tostring(urlset, encoding='utf-8')
    dom = minidom.parseString(xml_string)
    pretty_xml = dom.toprettyxml(indent="  ", encoding='utf-8')
    
    # Write to file
    output_path = '/app/frontend/public/sitemap.xml'
    with open(output_path, 'wb') as f:
        f.write(pretty_xml)
    
    print(f"✅ Sitemap generated successfully!")
    print(f"   Total URLs: {len(static_pages) + len(listings)}")
    print(f"   Static pages: {len(static_pages)}")
    print(f"   Listing pages: {len(listings)}")
    print(f"   Output: {output_path}")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(generate_sitemap())
