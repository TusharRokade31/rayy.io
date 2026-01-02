"""
Add 10-15 listings for each new category: Sports, Activity, Educational, Playzone
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from uuid import uuid4
from datetime import datetime, timezone
import os
import random

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "rayy_db")

# Video URLs from Google's sample videos
VIDEO_URLS = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
]

# Category-specific listings
LISTINGS_DATA = {
    "sports": [
        {
            "title": "Football Training for Kids",
            "subtitle": "Learn football skills and teamwork",
            "description": "Professional football training focusing on dribbling, passing, shooting, and team coordination. Perfect for beginners and intermediate players.",
            "media": [
                "https://images.unsplash.com/photo-1579952363873-27f3bade9f55",
                "https://images.unsplash.com/photo-1511886929837-354d827aae26",
                "https://images.unsplash.com/photo-1575361204480-aadea25e6e68"
            ]
        },
        {
            "title": "Basketball Skills Academy",
            "subtitle": "Master basketball fundamentals",
            "description": "Comprehensive basketball training covering shooting, dribbling, defense, and game strategies. Build confidence on the court!",
            "media": [
                "https://images.unsplash.com/photo-1546519638-68e109498ffc",
                "https://images.unsplash.com/photo-1504450758481-7338eba7524a",
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64"
            ]
        },
        {
            "title": "Cricket Coaching Classes",
            "subtitle": "Cricket skills and techniques",
            "description": "Learn batting, bowling, fielding from experienced coaches. Suitable for all skill levels from beginners to aspiring cricketers.",
            "media": [
                "https://images.unsplash.com/photo-1531415074968-036ba1b575da",
                "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972",
                "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e"
            ]
        },
        {
            "title": "Tennis for Juniors",
            "subtitle": "Professional tennis training",
            "description": "Structured tennis program focusing on technique, strategy, and match play. Individual and group sessions available.",
            "media": [
                "https://images.unsplash.com/photo-1554068865-24cecd4e34b8",
                "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67",
                "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0"
            ]
        },
        {
            "title": "Badminton Training",
            "subtitle": "Learn badminton from scratch",
            "description": "Complete badminton training covering footwork, strokes, serves, and game tactics. Fun and competitive environment.",
            "media": [
                "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea",
                "https://images.unsplash.com/photo-1626139907532-6be02d5a0c20",
                "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1"
            ]
        },
        {
            "title": "Table Tennis Academy",
            "subtitle": "Master table tennis skills",
            "description": "Expert coaching in table tennis techniques, spins, serves, and strategies. All equipment provided.",
            "media": [
                "https://images.unsplash.com/photo-1534877353491-b1abce79ca62",
                "https://images.unsplash.com/photo-1611916656173-875e4277bea6",
                "https://images.unsplash.com/photo-1593786481097-48eb9cf93cb9"
            ]
        },
        {
            "title": "Athletics & Track Training",
            "subtitle": "Sprint, jump, and throw like a champion",
            "description": "Track and field training focusing on running techniques, jumping, throwing events, and overall athletic development.",
            "media": [
                "https://images.unsplash.com/photo-1552674605-db6ffd4facb5",
                "https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee",
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"
            ]
        },
        {
            "title": "Volleyball Classes",
            "subtitle": "Team volleyball training",
            "description": "Learn serving, passing, setting, and spiking. Emphasis on teamwork and game strategy.",
            "media": [
                "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1",
                "https://images.unsplash.com/photo-1547347298-4074fc3086f0",
                "https://images.unsplash.com/photo-1593786481097-48eb9cf93cb9"
            ]
        },
        {
            "title": "Hockey Training Program",
            "subtitle": "Learn field hockey",
            "description": "Field hockey training covering stick work, passing, shooting, and tactical play. All safety equipment included.",
            "media": [
                "https://images.unsplash.com/photo-1515703407324-5f753afd8be8",
                "https://images.unsplash.com/photo-1589487391730-58f20eb2c308",
                "https://images.unsplash.com/photo-1560272564-c83b66b1ad12"
            ]
        },
        {
            "title": "Skating Classes",
            "subtitle": "Roller and inline skating",
            "description": "Learn skating basics, balance, turns, and advanced tricks. Safe and fun environment for all ages.",
            "media": [
                "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8",
                "https://images.unsplash.com/photo-1565992441121-4367c2967103",
                "https://images.unsplash.com/photo-1563089145-599997674d42"
            ]
        },
        {
            "title": "Cycling Training",
            "subtitle": "Master cycling techniques",
            "description": "Cycling training focusing on balance, speed control, road safety, and endurance building.",
            "media": [
                "https://images.unsplash.com/photo-1541625602330-2277a4c46182",
                "https://images.unsplash.com/photo-1571068316344-75bc76f77890",
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64"
            ]
        },
        {
            "title": "Golf for Kids",
            "subtitle": "Junior golf program",
            "description": "Introduction to golf covering grip, stance, swing, and putting. Learn etiquette and rules of the game.",
            "media": [
                "https://images.unsplash.com/photo-1535131749006-b7f58c99034b",
                "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa",
                "https://images.unsplash.com/photo-1592919505780-303950717480"
            ]
        }
    ],
    "activity": [
        {
            "title": "Drama & Theatre Workshop",
            "subtitle": "Acting and performance skills",
            "description": "Explore acting, voice modulation, expressions, and stage presence. Build confidence through drama and storytelling.",
            "media": [
                "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf",
                "https://images.unsplash.com/photo-1503095396549-807759245b35",
                "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7"
            ]
        },
        {
            "title": "Public Speaking & Debate",
            "subtitle": "Master the art of speaking",
            "description": "Develop public speaking, debate, and presentation skills. Overcome stage fear and express ideas confidently.",
            "media": [
                "https://images.unsplash.com/photo-1475721027785-f74eccf877e2",
                "https://images.unsplash.com/photo-1556157382-97eda2d62296",
                "https://images.unsplash.com/photo-1591115765373-5207764f72e7"
            ]
        },
        {
            "title": "Creative Writing Workshop",
            "subtitle": "Storytelling and writing skills",
            "description": "Develop creative writing skills through stories, poetry, and journaling. Unleash imagination and expression.",
            "media": [
                "https://images.unsplash.com/photo-1455390582262-044cdead277a",
                "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3",
                "https://images.unsplash.com/photo-1434030216411-0b793f4b4173"
            ]
        },
        {
            "title": "Photography for Kids",
            "subtitle": "Learn digital photography",
            "description": "Introduction to photography covering composition, lighting, and editing. Express creativity through the lens.",
            "media": [
                "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea",
                "https://images.unsplash.com/photo-1502920917128-1aa500764cbd",
                "https://images.unsplash.com/photo-1452587925148-ce544e77e70d"
            ]
        },
        {
            "title": "Magic & Illusion Classes",
            "subtitle": "Learn amazing magic tricks",
            "description": "Master card tricks, coin magic, and stage illusions. Develop showmanship and performance skills.",
            "media": [
                "https://images.unsplash.com/photo-1519608487953-e999c86e7455",
                "https://images.unsplash.com/photo-1533158326339-7f3cf2404354",
                "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7"
            ]
        },
        {
            "title": "Cooking Classes for Kids",
            "subtitle": "Fun culinary adventures",
            "description": "Learn basic cooking skills, recipes, kitchen safety, and nutrition. Create delicious treats and meals!",
            "media": [
                "https://images.unsplash.com/photo-1556910103-1c02745aae4d",
                "https://images.unsplash.com/photo-1466637574441-749b8f19452f",
                "https://images.unsplash.com/photo-1543353071-873f17a7a088"
            ]
        },
        {
            "title": "Gardening Workshop",
            "subtitle": "Learn to grow plants",
            "description": "Hands-on gardening experience teaching planting, care, and harvesting. Connect with nature!",
            "media": [
                "https://images.unsplash.com/photo-1592419044706-39796d40f98c",
                "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2",
                "https://images.unsplash.com/photo-1416879595882-3373a0480b5b"
            ]
        },
        {
            "title": "DIY Crafts & Projects",
            "subtitle": "Make amazing crafts",
            "description": "Create DIY projects using recycled materials, paper crafts, and art supplies. Fun and eco-friendly!",
            "media": [
                "https://images.unsplash.com/photo-1452860606245-08befc0ff44b",
                "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
                "https://images.unsplash.com/photo-1618172193622-ae2d025f4032"
            ]
        },
        {
            "title": "Model Making Workshop",
            "subtitle": "Build amazing models",
            "description": "Learn to build models of buildings, vehicles, and structures. Develop precision and patience.",
            "media": [
                "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
                "https://images.unsplash.com/photo-1546776310-eef45dd6d63c",
                "https://images.unsplash.com/photo-1485827404703-89b55fcc595e"
            ]
        },
        {
            "title": "Origami Art Classes",
            "subtitle": "Paper folding art",
            "description": "Master the Japanese art of paper folding. Create animals, flowers, and geometric designs.",
            "media": [
                "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
                "https://images.unsplash.com/photo-1452860606245-08befc0ff44b",
                "https://images.unsplash.com/photo-1618172193622-ae2d025f4032"
            ]
        },
        {
            "title": "Pottery & Clay Modeling",
            "subtitle": "Create with clay",
            "description": "Learn pottery techniques, clay modeling, and ceramic painting. Express creativity through clay art.",
            "media": [
                "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261",
                "https://images.unsplash.com/photo-1485846234645-a62644f84728",
                "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61"
            ]
        },
        {
            "title": "Calligraphy Workshop",
            "subtitle": "Beautiful handwriting art",
            "description": "Learn calligraphy techniques, letter formation, and artistic writing styles. Create beautiful hand-lettered art.",
            "media": [
                "https://images.unsplash.com/photo-1455390582262-044cdead277a",
                "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
                "https://images.unsplash.com/photo-1434030216411-0b793f4b4173"
            ]
        }
    ],
    "educational": [
        {
            "title": "Python Coding Basics",
            "subtitle": "Introduction to programming",
            "description": "Learn Python programming from scratch. Cover variables, loops, functions, and create simple games and apps.",
            "media": [
                "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
                "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
                "https://images.unsplash.com/photo-1517694712202-14dd9538aa97"
            ]
        },
        {
            "title": "Web Development for Kids",
            "subtitle": "Build websites from scratch",
            "description": "Learn HTML, CSS, and basic JavaScript. Create and publish your own website projects.",
            "media": [
                "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
                "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
                "https://images.unsplash.com/photo-1547658719-da2b51169166"
            ]
        },
        {
            "title": "Robotics & Electronics",
            "subtitle": "Build and program robots",
            "description": "Hands-on robotics using Arduino and sensors. Learn circuits, programming, and automation.",
            "media": [
                "https://images.unsplash.com/photo-1546776310-eef45dd6d63c",
                "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
                "https://images.unsplash.com/photo-1485827404703-89b55fcc595e"
            ]
        },
        {
            "title": "Math Olympiad Preparation",
            "subtitle": "Advanced mathematics",
            "description": "Prepare for math competitions with problem-solving strategies, logical reasoning, and number theory.",
            "media": [
                "https://images.unsplash.com/photo-1509228468518-180dd4864904",
                "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
                "https://images.unsplash.com/photo-1596495578065-6e0763fa1178"
            ]
        },
        {
            "title": "Science Lab Experiments",
            "subtitle": "Hands-on science learning",
            "description": "Conduct exciting science experiments in physics, chemistry, and biology. Learn scientific method.",
            "media": [
                "https://images.unsplash.com/photo-1532094349884-543bc11b234d",
                "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8",
                "https://images.unsplash.com/photo-1530587191325-3db32d826c18"
            ]
        },
        {
            "title": "Chess Mastery Classes",
            "subtitle": "Strategic chess training",
            "description": "Learn chess strategies, tactics, openings, and endgames. Play in tournaments and improve rating.",
            "media": [
                "https://images.unsplash.com/photo-1528819622765-d6bcf132f793",
                "https://images.unsplash.com/photo-1529699211952-734e80c4d42b",
                "https://images.unsplash.com/photo-1580541832626-2a7131ee809f"
            ]
        },
        {
            "title": "English Grammar & Writing",
            "subtitle": "Master English language",
            "description": "Comprehensive English course covering grammar, vocabulary, reading comprehension, and essay writing.",
            "media": [
                "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8",
                "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
                "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f"
            ]
        },
        {
            "title": "Mental Math Techniques",
            "subtitle": "Calculate faster mentally",
            "description": "Learn Vedic math tricks, mental calculation techniques, and speed arithmetic for competitive exams.",
            "media": [
                "https://images.unsplash.com/photo-1509228468518-180dd4864904",
                "https://images.unsplash.com/photo-1596495578065-6e0763fa1178",
                "https://images.unsplash.com/photo-1635070041078-e363dbe005cb"
            ]
        },
        {
            "title": "Geography & World Cultures",
            "subtitle": "Explore the world",
            "description": "Learn about countries, capitals, cultures, and geography through interactive maps and activities.",
            "media": [
                "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1",
                "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
                "https://images.unsplash.com/photo-1569163139394-de4798aa62b6"
            ]
        },
        {
            "title": "History Through Stories",
            "subtitle": "Interactive history lessons",
            "description": "Learn history through engaging stories, timelines, and historical figures. Make history come alive!",
            "media": [
                "https://images.unsplash.com/photo-1461360228754-6e81c478b882",
                "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
                "https://images.unsplash.com/photo-1457369804613-52c61a468e7d"
            ]
        },
        {
            "title": "Environmental Science",
            "subtitle": "Learn about our planet",
            "description": "Study ecosystems, climate change, sustainability, and conservation through hands-on projects.",
            "media": [
                "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
                "https://images.unsplash.com/photo-1466611653911-95081537e5b7",
                "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05"
            ]
        },
        {
            "title": "Astronomy & Space Science",
            "subtitle": "Explore the universe",
            "description": "Learn about planets, stars, galaxies, and space exploration. Use telescopes and planetarium software.",
            "media": [
                "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
                "https://images.unsplash.com/photo-1462331940025-496dfbfc7564",
                "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06"
            ]
        }
    ],
    "playzone": [
        {
            "title": "Indoor Play Arena",
            "subtitle": "Safe indoor play activities",
            "description": "Supervised indoor play with slides, ball pits, climbing structures, and age-appropriate toys.",
            "media": [
                "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9",
                "https://images.unsplash.com/photo-1587654780291-39c9404d746b",
                "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1"
            ]
        },
        {
            "title": "Trampoline Park Sessions",
            "subtitle": "Jump and have fun",
            "description": "Safe trampoline jumping sessions with games, dodgeball, and foam pits. Supervised by trained staff.",
            "media": [
                "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8",
                "https://images.unsplash.com/photo-1565992441121-4367c2967103",
                "https://images.unsplash.com/photo-1563089145-599997674d42"
            ]
        },
        {
            "title": "Soft Play Area for Toddlers",
            "subtitle": "Safe play for little ones",
            "description": "Specially designed soft play area for toddlers with age-appropriate toys and activities.",
            "media": [
                "https://images.unsplash.com/photo-1587654780291-39c9404d746b",
                "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9",
                "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1"
            ]
        },
        {
            "title": "Adventure Play Zone",
            "subtitle": "Climbing and adventure",
            "description": "Obstacle courses, rock climbing walls, rope bridges, and adventure activities for active kids.",
            "media": [
                "https://images.unsplash.com/photo-1551522435-a13afa10f103",
                "https://images.unsplash.com/photo-1606787366850-de6330128bfc",
                "https://images.unsplash.com/photo-1534258936925-c58bed479fcb"
            ]
        },
        {
            "title": "Sensory Play Activities",
            "subtitle": "Explore through senses",
            "description": "Sensory activities with textures, sounds, colors, and materials. Great for early development.",
            "media": [
                "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1",
                "https://images.unsplash.com/photo-1587654780291-39c9404d746b",
                "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9"
            ]
        },
        {
            "title": "Virtual Reality Gaming",
            "subtitle": "VR games and experiences",
            "description": "Age-appropriate VR games and educational experiences. Supervised sessions with latest VR technology.",
            "media": [
                "https://images.unsplash.com/photo-1617802690992-15d93263d3a9",
                "https://images.unsplash.com/photo-1542751371-adc38448a05e",
                "https://images.unsplash.com/photo-1535223289827-42f1e9919769"
            ]
        },
        {
            "title": "Board Games & Puzzles",
            "subtitle": "Strategic thinking games",
            "description": "Variety of board games, puzzles, and strategy games. Develop critical thinking and social skills.",
            "media": [
                "https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba",
                "https://images.unsplash.com/photo-1632501641765-e568d28b0015",
                "https://images.unsplash.com/photo-1566694271453-390536dd1f0d"
            ]
        },
        {
            "title": "Arts & Crafts Playzone",
            "subtitle": "Creative arts station",
            "description": "Open play area with art supplies, craft materials, and creative activities. Make and take home creations!",
            "media": [
                "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
                "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b",
                "https://images.unsplash.com/photo-1596548438137-d51ea5c83ca5"
            ]
        },
        {
            "title": "Building Blocks Zone",
            "subtitle": "LEGO and building toys",
            "description": "Large collection of LEGO, building blocks, and construction toys. Build amazing structures!",
            "media": [
                "https://images.unsplash.com/photo-1587654780291-39c9404d746b",
                "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1",
                "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9"
            ]
        },
        {
            "title": "Musical Play Area",
            "subtitle": "Explore music and sounds",
            "description": "Musical instruments, sound exploration, and rhythm activities. Free play with keyboards, drums, and more.",
            "media": [
                "https://images.unsplash.com/photo-1507838153414-b4b713384a76",
                "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
                "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0"
            ]
        },
        {
            "title": "Dress-Up & Role Play",
            "subtitle": "Imaginative play zone",
            "description": "Costumes, props, and themed play areas for role-playing. Be a doctor, chef, firefighter, or anything!",
            "media": [
                "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9",
                "https://images.unsplash.com/photo-1587654780291-39c9404d746b",
                "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1"
            ]
        },
        {
            "title": "Outdoor Adventure Playzone",
            "subtitle": "Nature and outdoor play",
            "description": "Outdoor play area with swings, slides, sandboxes, and nature exploration activities.",
            "media": [
                "https://images.unsplash.com/photo-1516627145497-ae6968895b74",
                "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9",
                "https://images.unsplash.com/photo-1551522435-a13afa10f103"
            ]
        }
    ]
}

async def add_listings():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        print("🎯 Adding listings for new categories...\n")
        
        # Get category IDs
        categories = {}
        for slug in ["sports", "activity", "educational", "playzone"]:
            cat = await db.categories.find_one({"slug": slug})
            if cat:
                categories[slug] = cat["id"]
            else:
                print(f"❌ Category {slug} not found!")
                return
        
        # Get a partner to assign listings to
        partner = await db.users.find_one({"role": "partner_owner"})
        if not partner:
            print("❌ No partner found in database!")
            return
        
        partner_id = partner["id"]
        
        # Get a venue for offline listings
        venue = await db.venues.find_one({"owner_id": partner_id})
        venue_id = venue["id"] if venue else None
        
        total_added = 0
        
        for category_slug, listings in LISTINGS_DATA.items():
            print(f"\n📁 Adding listings for {category_slug.upper()}...")
            
            for i, listing_data in enumerate(listings):
                listing = {
                    "id": str(uuid4()),
                    "partner_id": partner_id,
                    "title": listing_data["title"],
                    "subtitle": listing_data["subtitle"],
                    "category": category_slug,
                    "category_id": categories[category_slug],
                    "description": listing_data["description"],
                    "age_min": random.randint(5, 8),
                    "age_max": random.randint(12, 16),
                    "duration_minutes": random.choice([45, 60, 90]),
                    "base_price_inr": random.randint(400, 1200),
                    "credits_per_session": random.randint(1, 3),
                    "is_online": random.choice([True, False]),
                    "venue_id": venue_id if not random.choice([True, False]) and venue_id else None,
                    "trial_available": True,
                    "trial_price_inr": random.randint(99, 299),
                    "media": listing_data["media"],
                    "video_url": random.choice(VIDEO_URLS),
                    "images": listing_data["media"],  # Backward compatibility
                    "status": "active",
                    "rating": round(random.uniform(4.2, 4.9), 1),
                    "rating_count": random.randint(15, 150),
                    "equipment_needed": "All equipment provided",
                    "safety_notes": "Safety measures in place",
                    "parent_presence_required": False,
                    "created_at": datetime.now(timezone.utc)
                }
                
                await db.listings.insert_one(listing)
                total_added += 1
                print(f"  ✅ {listing_data['title']}")
        
        print(f"\n🎉 Successfully added {total_added} listings!")
        
        # Verify counts
        print("\n📊 Category listing counts:")
        for slug in ["sports", "activity", "educational", "playzone"]:
            count = await db.listings.count_documents({"category": slug})
            print(f"  {slug.upper()}: {count} listings")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(add_listings())
