// Curated, sourced items for Screen 6. Populated with real, dated items
// (Jobs and Skills Australia, ANMF/ANMJ, Department of Education) and passed
// through summariseMarketUpdate() in src/lib/ai.js to generate the
// headline/summary/statusLabel/topic/whyItMatters fields shown in the UI.
export const marketSources = [
  {
    id: 'registered-nurse-nsw-jsa-2026',
    sourceText:
      'New South Wales accounts for 26.5% of employed Registered Nurses (ANZSCO 2544) nationally, the second-largest state share after Victoria (28.1%). Nationally there are 366,200 people employed as Registered Nurses, with annual employment growth of 12,600. Source: ABS Labour Force Survey, Detailed, February 2026, Jobs and Skills Australia trend data.',
    occupation: 'Registered Nurse',
    state: 'NSW',
    source: 'Jobs and Skills Australia',
    publishedDate: '2026-02-01',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'carpenter-vic-jsa-census2021',
    sourceText:
      'Victoria accounts for 30.9% of employed Carpenters (ANZSCO 331212) nationally, narrowly the largest state share ahead of New South Wales (30.8%) and Queensland (20.6%). Nationally there are 104,900 people employed as Carpenters, 84% of whom work full-time hours (43 hours/week on average), compared with 64%/44 hours across all occupations. Source: ABS, 2021 Census of Population and Housing based on place of usual residence, Jobs and Skills Australia occupation profile.',
    occupation: 'Carpenter',
    state: 'VIC',
    source: 'Jobs and Skills Australia',
    publishedDate: '2021-08-10',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'early-childhood-teacher-qld-jsa-2026',
    sourceText:
      'Queensland accounts for 13.1% of employed Early Childhood (Pre-primary School) Teachers (ANZSCO 2411) nationally, well behind Victoria (36.7%) and New South Wales (36.5%). Nationally there are 71,900 people employed in the occupation, with annual employment growth of 2,700. Source: ABS Labour Force Survey, Detailed, February 2026, Jobs and Skills Australia trend data.',
    occupation: 'Early Childhood Teacher',
    state: 'QLD',
    source: 'Jobs and Skills Australia',
    publishedDate: '2026-02-01',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'registered-nurse-national-anmf-staffing-2026',
    sourceText:
      'In 2026, the ANMF is calling on the federal government to mandate national minimum staffing levels across all healthcare settings, accounting for patient acuity, skill mix, and fluctuating demand, and embedded into the National Safety and Quality Health Service (NSQHS) Standards. The ANMF states that without enforceable minimum staffing levels, disparities persist between states and territories and between metropolitan and regional facilities, and that Australia continues to face critical staffing shortages that compromise patient outcomes, staff wellbeing, and the sustainability of health services. Source: "ANMF PRIORITIES 2026: Workforce reform", Australian Nursing and Midwifery Journal, 29 January 2026.',
    occupation: 'Registered Nurse',
    state: 'National',
    source: 'Australian Nursing and Midwifery Journal (ANMF)',
    publishedDate: '2026-01-29',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'registered-nurse-national-anmf-pracpayment-2026',
    sourceText:
      'The ANMF welcomed the federal government\'s introduction of the Commonwealth Prac Payment in July 2025, a means-tested payment supporting nursing and midwifery students during mandatory clinical placements. The ANMF is campaigning to expand eligibility so more students can access support, noting that students face significant financial and time burdens during clinical placements, particularly mature-age and female students. Source: "ANMF PRIORITIES 2026: Workforce reform", Australian Nursing and Midwifery Journal, 29 January 2026.',
    occupation: 'Registered Nurse',
    state: 'National',
    source: 'Australian Nursing and Midwifery Journal (ANMF)',
    publishedDate: '2026-01-29',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'carpenter-national-construction-jsa-2026',
    sourceText:
      'The Construction industry, the largest employing industry for Carpenters, employed 1,371,500 people nationally as of the February 2026 reference period, representing 9.3% of the national workforce. Median earnings in Construction are $1,600 per week, lower than the all-industries median of $1,741. Source: ABS, Labour Force Survey, Detailed, February 2026, Jobs and Skills Australia trend data.',
    occupation: 'Carpenter',
    state: 'National',
    source: 'Jobs and Skills Australia',
    publishedDate: '2026-02-01',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'early-childhood-teacher-national-education-gov-2026',
    sourceText:
      'Education Ministers met on 15 July 2026 and considered initial advice on establishing a national early education and care commission to strengthen safety and quality in Australia\'s early childhood education and care (ECEC) system. Ministers agreed to explore further development of the proposal, which would involve reform of the existing Australian Children\'s Education and Care Quality Authority, with further advice expected at the next meeting following stakeholder consultation. Ministers also agreed to progress a second tranche of quality and safety reforms covering supervision, transparency and fencing safety, with legislative amendments planned as soon as possible in 2027. Source: Department of Education (Australian Government), "Early childhood actions from July 2026 Education Ministers Meeting", 16 July 2026.',
    occupation: 'Early Childhood Teacher',
    state: 'National',
    source: 'Department of Education (Australian Government)',
    publishedDate: '2026-07-16',
    retrievedDate: '2026-09-13',
  },
]
