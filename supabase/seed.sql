-- ====================================================================
-- CivicLens: Comprehensive Seed Data for Municipal Transparency
-- Model Constituency: Chennai South / Velachery - Adyar Corridor
-- ====================================================================

-- 1. SEED DEPARTMENTS
INSERT INTO departments (id, name, code, description, contact_email, contact_phone, active)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Roads & Bridges Department', 'ROADS', 'Responsible for road maintenance, pothole patching, pedestrian pathways, and bridge infrastructure.', 'roads@civiclens.gov', '+91 44 2538 4101', true),
    ('11111111-1111-1111-1111-111111111102', 'Solid Waste & Sanitation Management', 'SAN', 'Handles garbage collection, street sweeping, community bin clearance, and waste segregation.', 'sanitation@civiclens.gov', '+91 44 2538 4102', true),
    ('11111111-1111-1111-1111-111111111103', 'Water Supply & Sewerage Board', 'WATER', 'Manages drinking water distribution, pipeline leak repairs, sewer overflow clearance, and water quality.', 'water@civiclens.gov', '+91 44 2538 4103', true),
    ('11111111-1111-1111-1111-111111111104', 'Electrical & Streetlighting Division', 'ELEC', 'Maintains streetlights, high-mast lamps, junction boxes, and public electrical safety.', 'electrical@civiclens.gov', '+91 44 2538 4104', true),
    ('11111111-1111-1111-1111-111111111105', 'Stormwater Drainage & Flood Mitigation', 'DRAIN', 'Constructs and desilts stormwater drains, culverts, and monitors monsoon waterlogging points.', 'drainage@civiclens.gov', '+91 44 2538 4105', true),
    ('11111111-1111-1111-1111-111111111106', 'Public Parks & Municipal Facilities', 'PARKS', 'Maintains neighborhood parks, play equipment, municipal community centers, and public toilets.', 'parks@civiclens.gov', '+91 44 2538 4106', true)
ON CONFLICT (code) DO NOTHING;

-- 2. SEED JURISDICTIONS (Wards)
INSERT INTO jurisdictions (id, name, name_ta, ward_number, zone, area_description, center_lat, center_lng, active)
VALUES
    ('22222222-2222-2222-2222-222222222201', 'Ward 172 - Adyar', 'வார்டு 172 - அடையாறு', 'W-172', 'Zone 13 Adyar', 'Covers Gandhi Nagar, Kasturba Nagar, Sardar Patel Road, and Canal Bank.', 13.0067, 80.2575, true),
    ('22222222-2222-2222-2222-222222222202', 'Ward 173 - Mylapore', 'வார்டு 173 - மயிலாப்பூர்', 'W-173', 'Zone 09 Teynampet', 'Covers Luz Church Road, Kapaleeshwarar Temple zone, and Santhome High Road.', 13.0334, 80.2685, true),
    ('22222222-2222-2222-2222-222222222203', 'Ward 174 - T. Nagar', 'வார்டு 174 - தி. நகர்', 'W-174', 'Zone 10 Kodambakkam', 'Covers Pondy Bazaar, Usman Road commercial district, and Panagal Park surroundings.', 13.0418, 80.2341, true),
    ('22222222-2222-2222-2222-222222222204', 'Ward 175 - Velachery', 'வார்டு 175 - வேளச்சேரி', 'W-175', 'Zone 13 Adyar', 'Covers Bypass Road, Lake View Area, Vijayanagar Junction, and Taramani Link Road.', 12.9791, 80.2212, true),
    ('22222222-2222-2222-2222-222222222205', 'Ward 176 - Guindy', 'வார்டு 176 - கிண்டி', 'W-176', 'Zone 13 Adyar', 'Covers Industrial Estate, Kathipara Junction vicinity, and Race Course road.', 13.0067, 80.2050, true),
    ('22222222-2222-2222-2222-222222222206', 'Ward 170 - Besant Nagar', 'வார்டு 170 - பெசன்ட் நகர்', 'W-170', 'Zone 13 Adyar', 'Covers Beach promenade, Elliot Beach residential colony, and 4th Main Road.', 12.9982, 80.2707, true)
ON CONFLICT (ward_number) DO NOTHING;

-- 3. SEED ISSUE CATEGORIES
INSERT INTO issue_categories (id, name, name_ta, code, description, icon, default_sla_acknowledgement_hours, default_sla_resolution_days, active)
VALUES
    ('33333333-3333-3333-3333-333333333301', 'Roads & Potholes', 'சாலைகள் மற்றும் பள்ளங்கள்', 'ROADS', 'Potholes, asphalt erosion, open trenches, broken curbs, and missing road median markers.', 'Construction', 24, 5, true),
    ('33333333-3333-3333-3333-333333333302', 'Garbage & Waste', 'குப்பை மற்றும் கழிவு மேலாண்மை', 'GARBAGE', 'Uncollected garbage, overflowing roadside bins, illegal dumping, and carcass disposal.', 'Trash2', 12, 2, true),
    ('33333333-3333-3333-3333-333333333303', 'Drainage & Waterlogging', 'வடிகால் மற்றும் மழைநீர் தேங்குதல்', 'DRAINAGE', 'Clogged drains, open drain manholes, monsoon flooding, and desilting requirements.', 'Waves', 24, 4, true),
    ('33333333-3333-3333-3333-333333333304', 'Water Supply & Sewerage', 'குடிநீர் மற்றும் கழிவுநீர்', 'WATER', 'Drinking water pipeline bursts, contamination, low pressure, and sewage backflow.', 'Droplets', 12, 3, true),
    ('33333333-3333-3333-3333-333333333305', 'Streetlights & Electrical', 'தெருவிளக்குகள் மற்றும் மின்சாரம்', 'LIGHTS', 'Non-functional streetlights, sparking junction boxes, exposed electric wires, and dark spots.', 'Lightbulb', 24, 2, true),
    ('33333333-3333-3333-3333-333333333306', 'Public Facilities & Parks', 'பொது வசதிகள் மற்றும் பூங்காக்கள்', 'FACILITIES', 'Damaged park equipment, dilapidated public restrooms, broken footpaths, and bench repairs.', 'Building', 48, 7, true),
    ('33333333-3333-3333-3333-333333333307', 'Other Civic Issues', 'இதர பொதுப் பிரச்சினைகள்', 'OTHER', 'Encroachments, stray cattle, unauthorized hoardings, and general municipal hazards.', 'AlertTriangle', 48, 7, true)
ON CONFLICT (code) DO NOTHING;

-- 4. SEED ROUTING RULES (Category -> Department)
INSERT INTO routing_rules (category_id, department_id, priority, active)
VALUES
    ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', 1, true),
    ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102', 1, true),
    ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111105', 1, true),
    ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111103', 1, true),
    ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111104', 1, true),
    ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111106', 1, true)
ON CONFLICT DO NOTHING;

-- 5. SEED PROFILES (Pre-configured demonstration roles)
INSERT INTO profiles (id, full_name, email, phone, role, department_id, preferred_language, area)
VALUES
    ('44444444-4444-4444-4444-444444444401', 'Dinesh Karthik', 'citizen@civiclens.gov', '+91 98401 23456', 'citizen', NULL, 'en', 'Ward 175 - Velachery'),
    ('44444444-4444-4444-4444-444444444402', 'Er. Meenakshi Sundaram', 'officer.roads@civiclens.gov', '+91 98402 34567', 'officer', '11111111-1111-1111-1111-111111111101', 'en', 'Zone 13 Adyar Division'),
    ('44444444-4444-4444-4444-444444444403', 'Er. Arulmozhi Varman', 'officer.sanitation@civiclens.gov', '+91 98403 45678', 'officer', '11111111-1111-1111-1111-111111111102', 'en', 'Zone 13 Sanitation Wing'),
    ('44444444-4444-4444-4444-444444444404', 'Kumaravel P. (Field Tech)', 'worker.kumar@civiclens.gov', '+91 98404 56789', 'field_worker', '11111111-1111-1111-1111-111111111101', 'en', 'Velachery Field Depot'),
    ('44444444-4444-4444-4444-444444444405', 'Hon. K. Rajendran, MLA', 'mla.constituency@civiclens.gov', '+91 98405 67890', 'representative', NULL, 'en', 'Velachery Constituency HQ'),
    ('44444444-4444-4444-4444-444444444406', 'CivicLens Chief Administrator', 'admin@civiclens.gov', '+91 98400 11223', 'admin', NULL, 'en', 'Civic Technology Cell')
ON CONFLICT (email) DO NOTHING;

-- 6. SEED PUBLIC DEVELOPMENT PROJECTS
INSERT INTO projects (id, name, description, category, location, agency, status, start_date, expected_completion, approved_amount, expenditure, funding_source, source_reference, demo_data)
VALUES
    ('55555555-5555-5555-5555-555555555501', 'Velachery Bypass Stormwater Drain Interlink', 'Construction of twin-box reinforced concrete storm drains connecting Lake View Road to Pallikaranai marsh overflow channel to prevent monsoon inundation.', 'Drainage & Flood Mitigation', 'Ward 175 - Velachery Bypass', 'Greater Chennai Corporation (Stormwater Wing)', 'in_progress', '2025-10-15', '2026-11-30', 48500000.00, 31200000.00, 'State Disaster Mitigation Fund (SDMF)', 'Tender Ref: GCC/SWD/2025/C-112', true),
    ('55555555-5555-5555-5555-555555555502', 'Adyar Ward 172 LED Smart Streetlighting Retrofit', 'Replacement of 1,420 high-pressure sodium street lamps with energy-efficient smart LED fixtures equipped with automatic dimming and feeder monitoring units.', 'Electrical Infrastructure', 'Ward 172 - Kasturba Nagar & Canal Bank', 'Tamil Nadu Energy Development Agency & GCC', 'completed', '2025-06-01', '2026-02-15', 18200000.00, 17850000.00, 'Smart Cities Mission', 'Work Order: SCM/CHN/ELEC-887', true),
    ('55555555-5555-5555-5555-555555555503', 'Mylapore Heritage Pedestrian Corridor & Paving', 'Pedestrianization and heritage-sensitive cobblestone footpath reconstruction with tactile pavers, bollards, and underground utility ducting.', 'Roads & Footpaths', 'Ward 173 - Mylapore Tank & S Mada St', 'Chennai Smart City Limited', 'delayed', '2025-08-01', '2026-08-30', 32000000.00, 19400000.00, 'Capital Grant Scheme', 'Tender: CSCL/INFRA/2025/14', true),
    ('55555555-5555-5555-5555-555555555504', 'Decentralized Micro-Composting Center (MCC)', 'Setting up a 5-tonne daily capacity wet-waste biomethanation and composting facility to reduce landfill transit from wards 170 and 172.', 'Solid Waste Management', 'Ward 170 - Besant Nagar Coastal Road', 'Solid Waste Management Cell', 'in_progress', '2026-01-10', '2026-07-25', 12500000.00, 7200000.00, 'Swachh Bharat Mission (Urban)', 'Sanction: SBM-U/TN/2025/MCC-44', true),
    ('55555555-5555-5555-5555-555555555505', 'T. Nagar Underground Sewer Replacement Phase II', 'Replacement of aging 40-year-old cast iron sewer trunk mains with 600mm HDPE pipelines to eliminate chronic sewage overflows.', 'Water Supply & Sewerage', 'Ward 174 - Usman Road Corridor', 'Chennai Metrowater (CMWSSB)', 'approved', '2026-04-01', '2027-03-31', 64000000.00, 4500000.00, 'AMRUT 2.0', 'Board Approval: CMWSSB/PL-2026/09', true)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED CORE CIVIC ISSUES (With verified real and AI-flagged evidence)
INSERT INTO issues (id, complaint_code, citizen_id, category_id, title, description, severity, status, latitude, longitude, location_text, jurisdiction_id, department_id, assigned_officer_id, assigned_field_worker_id, is_overdue, sla_target_date, ai_verification_status)
VALUES
    (
        '66666666-6666-6666-6666-666666666601',
        'CL-2026-000101',
        '44444444-4444-4444-4444-444444444401',
        '33333333-3333-3333-3333-333333333301',
        'Massive Pothole Cluster on Velachery Main Road near Vijayanagar Bus Stand',
        'Multiple deep craters extending 4 meters across the arterial lane causing severe traffic bottlenecks and two-wheeler skidding hazards.',
        'high',
        'in_progress',
        12.9791,
        80.2212,
        'Velachery Main Road, Near Vijayanagar Bus Terminus',
        '22222222-2222-2222-2222-222222222204',
        '11111111-1111-1111-1111-111111111101',
        '44444444-4444-4444-4444-444444444402',
        '44444444-4444-4444-4444-444444444404',
        false,
        NOW() + INTERVAL '3 days',
        'verified_real'
    ),
    (
        '66666666-6666-6666-6666-666666666602',
        'CL-2026-000102',
        '44444444-4444-4444-4444-444444444401',
        '33333333-3333-3333-3333-333333333302',
        'Overflowing Community Garbage Bin on 2nd Avenue',
        'Waste has not been cleared for over 48 hours. Garbage spilling onto the pedestrian sidewalk creating foul odor and stray dog menace.',
        'medium',
        'resolved',
        13.0067,
        80.2575,
        '2nd Avenue, Shastri Nagar, Adyar',
        '22222222-2222-2222-2222-222222222201',
        '11111111-1111-1111-1111-111111111102',
        '44444444-4444-4444-4444-444444444403',
        NULL,
        false,
        NOW() - INTERVAL '1 day',
        'verified_real'
    ),
    (
        '66666666-6666-6666-6666-666666666603',
        'CL-2026-000103',
        '44444444-4444-4444-4444-444444444401',
        '33333333-3333-3333-3333-333333333305',
        'Non-functional High-Mast Light at Usman Road Flyover Ramp',
        'The main intersection light has been dark for 5 consecutive nights creating severe accident risk for night commuters.',
        'medium',
        'escalated',
        13.0418,
        80.2341,
        'Usman Road Flyover Junction, T. Nagar',
        '22222222-2222-2222-2222-222222222203',
        '11111111-1111-1111-1111-111111111104',
        NULL,
        NULL,
        true,
        NOW() - INTERVAL '4 days',
        'verified_real'
    )
ON CONFLICT (complaint_code) DO NOTHING;

-- 8. SEED ISSUE EVIDENCE
INSERT INTO issue_evidence (id, issue_id, uploaded_by, file_path, file_type, evidence_type, caption, authenticity)
VALUES
    (
        '77777777-7777-7777-7777-777777777701',
        '66666666-6666-6666-6666-666666666601',
        '44444444-4444-4444-4444-444444444401',
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        'image/jpeg',
        'citizen_report',
        'Crater depth inspection on Velachery Main Rd',
        '{"is_ai_generated": false, "ai_probability": 0.03, "real_probability": 0.97, "confidence": 0.97, "verdict": "real", "engine": "microsoft/cvt-13"}'::jsonb
    ),
    (
        '77777777-7777-7777-7777-777777777702',
        '66666666-6666-6666-6666-666666666602',
        '44444444-4444-4444-4444-444444444401',
        'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
        'image/jpeg',
        'citizen_report',
        'Overflowing waste bins',
        '{"is_ai_generated": false, "ai_probability": 0.05, "real_probability": 0.95, "confidence": 0.95, "verdict": "real", "engine": "microsoft/cvt-13"}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- 9. SEED TIMELINE EVENTS
INSERT INTO timeline_events (issue_id, actor_id, actor_role, actor_name, event_type, old_status, new_status, note)
VALUES
    ('66666666-6666-6666-6666-666666666601', '44444444-4444-4444-4444-444444444401', 'citizen', 'Dinesh Karthik', 'issue_created', NULL, 'submitted', 'Complaint submitted via CivicLens mobile portal with authentic photo proof.'),
    ('66666666-6666-6666-6666-666666666601', '44444444-4444-4444-4444-444444444402', 'officer', 'Er. Meenakshi Sundaram', 'assigned', 'submitted', 'assigned', 'Auto-routed to Roads & Bridges Department under Ward 175 jurisdiction.'),
    ('66666666-6666-6666-6666-666666666601', '44444444-4444-4444-4444-444444444404', 'field_worker', 'Kumaravel P. (Field Tech)', 'work_started', 'assigned', 'in_progress', 'Cold mix asphalt batch allocated. Patching team mobilized to site.');
