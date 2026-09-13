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
  {
    id: 'software-engineer-nsw-jsa-2026',
    sourceText:
      'New South Wales accounts for 42.2% of employed Software Engineers (ANZSCO 261313) nationally, the largest state share of any state or territory. Nationally there are 55,200 people employed as Software Engineers, with a part-time share of 8% and a female share of 16%, both well below the all-occupations averages. Source: Jobs and Skills Australia, Software Engineers occupation profile, based on ABS Labour Force Survey, Detailed, February 2026.',
    occupation: 'Software Engineer',
    state: 'NSW',
    source: 'Jobs and Skills Australia',
    publishedDate: '2026-02-01',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'software-engineer-national-techcouncil-2026',
    sourceText:
      'Australia\'s tech workforce reached approximately 977,000 people by November 2025, made up of 424,000 people in direct tech roles and 553,000 in technical roles embedded in other industries. Software engineering remained the largest technical occupational category, with software engineering roles growing 7% year-on-year even as employers adopted generative AI tools; the Tech Council\'s analysis found no discernible evidence of a differential decline in early-career technical employment since generative AI became widely available in late 2022. Source: Tech Council of Australia, "Tech Jobs Report 2026", 13 August 2026.',
    occupation: 'Software Engineer',
    state: 'National',
    source: 'Tech Council of Australia',
    publishedDate: '2026-08-13',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'software-engineer-national-acs-digitalpulse-2026',
    sourceText:
      'Australia\'s technology workforce shrank by 0.3% in 2025 to around 967,000 workers, the first year-on-year decrease recorded in the 12 years the Australian Computer Society (ACS) has tracked the sector. Roles in ICT sales, ICT trades and ICT administration/logistics support declined, while technical, professional and management tech roles grew. The report projects Australia will need a further 259,000 technology workers by 2035 to meet demand. Source: Australian Computer Society & Deloitte Access Economics, "Australia\'s Digital Pulse 2026" (12th annual report), 11 August 2026.',
    occupation: 'Software Engineer',
    state: 'National',
    source: 'Australian Computer Society (ACS) / Deloitte Access Economics',
    publishedDate: '2026-08-11',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'software-engineer-nsw-skillslist-2025',
    sourceText:
      'Software and Applications Programmers (ANZSCO unit group 2613, which includes Software Engineers, ANZSCO 261313) is one of the ICT unit groups included on the New South Wales Skills List for both the Skilled Nominated (subclass 190) and Skilled Work Regional (subclass 491) visas for the 2025-26 program year. The NSW Government notes its skills lists operate at the ANZSCO unit-group level and that not all occupations within a listed unit group are eligible for nomination. NSW opened its subclass 190 invitation rounds for the 2025-26 program year on 20 October 2025. Source: NSW Government (Investment NSW), "NSW Skills Lists", nsw.gov.au, effective for the 2025-26 program year (opened 20 October 2025).',
    occupation: 'Software Engineer',
    state: 'NSW',
    source: 'NSW Government (Investment NSW)',
    publishedDate: '2025-10-20',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'software-engineer-national-acs-pathways-2026',
    sourceText:
      'Around 40% of people who entered the Australian tech workforce over the past five years came through non-traditional pathways rather than a university degree: roughly 55,000 through workplace training or upskilling, 44,000 through industry credentials, and 34,000 through self-directed learning. The same report found Year 12 student participation in technology subjects fell to 28% in 2024. Source: Australian Computer Society & Deloitte Access Economics, "Australia\'s Digital Pulse 2026" (12th annual report), 11 August 2026.',
    occupation: 'Software Engineer',
    state: 'National',
    source: 'Australian Computer Society (ACS) / Deloitte Access Economics',
    publishedDate: '2026-08-11',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'software-engineer-national-techcouncil-regional-2026',
    sourceText:
      'Technical (tech) jobs in regional Australia grew 12% over the five years to November 2025, more than twice the growth rate recorded in major cities over the same period, pointing to growing technology employment opportunities outside Sydney and other capital cities. Source: Tech Council of Australia, "Tech Jobs Report 2026", 13 August 2026.',
    occupation: 'Software Engineer',
    state: 'National',
    source: 'Tech Council of Australia',
    publishedDate: '2026-08-13',
    retrievedDate: '2026-09-13',
  },
  {
    id: 'software-engineer-national-jsa-industry-2026',
    sourceText:
      'Software Engineers most commonly work in the Professional, Scientific and Technical Services, Financial and Insurance Services, and Information Media and Telecommunications industries. Professional, Scientific and Technical Services, the largest employing industry for the occupation, has median weekly earnings of $2,071, well above the all-industries median of $1,741. Source: Jobs and Skills Australia, Software Engineers occupation profile and Professional, Scientific and Technical Services industry profile, based on ABS Labour Force Survey, Detailed, February 2026.',
    occupation: 'Software Engineer',
    state: 'National',
    source: 'Jobs and Skills Australia',
    publishedDate: '2026-02-01',
    retrievedDate: '2026-09-13',
  },
]
