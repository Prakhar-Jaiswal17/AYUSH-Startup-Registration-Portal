# AYUSH Startup Resources & Portals Directory

This reference guide documents the official government portals, regulatory systems, research databases, and startup support platforms integrated into the AYUSH Startup Registration Portal.

---

## 1. Directory of Curated Resources

### Government & Scheme Portals
* **Ministry of AYUSH — Official Portal** (`https://ayush.gov.in`)
  * Official guidelines, national policies, notifications, and central sector schemes for Ayurveda, Yoga & Naturopathy, Unani, Siddha, and Homoeopathy.
* **National AYUSH Mission (NAM)** (`https://nam.ayush.gov.in`)
  * Centrally sponsored scheme designed to upgrade AYUSH educational institutions, enforce quality control of ASU&H drugs, and provide cost-effective AYUSH health services.

### Startup Support & Recognition
* **Startup India Portal** (`https://www.startupindia.gov.in`)
  * Flagship Government of India initiative offering DPIIT recognition, tax exemptions, seed funding grants, and national startup challenges.
* **DPIIT Recognition Guidelines** (`https://www.startupindia.gov.in`)
  * Framework for formal recognition as a startup, intellectual property fast-tracking, and self-certification compliance.
* **AYUSH Export Promotion Council (AYUSHEXCIL)** (`https://ayushexcil.in`)
  * Set up by the Ministry of AYUSH and Ministry of Commerce to facilitate overseas registration, trade exhibitions, and international compliance for AYUSH exporters.

### Regulatory & Licensing Bodies
* **e-Aushadhi Portal** (`https://e-aushadhi.gov.in`)
  * Direct licensing, product approval, and Schedule T Good Manufacturing Practice (GMP) compliance management for Ayurvedic, Siddha, and Unani drugs.
* **FSSAI FoSCoS Portal** (`https://foscos.fssai.gov.in`)
  * Food Safety Compliance System for obtaining central/state food business operating licenses and regulatory clearances for AYUSH dietary supplements and nutraceuticals.

### Research & Clinical Studies
* **AYUSH Research Portal** (`https://ayushportal.nic.in`)
  * Maintained by NIC and Ministry of AYUSH; digital repository of clinical trials, evidence-based research studies, and scientific publications across traditional medicine streams.
* **Central Council for Research in Ayurvedic Sciences (CCRAS)** (`https://ccras.nic.in`)
  * Apex body in India for the formulation, coordination, development, and promotion of scientific research in Ayurveda.
* **Clinical Trial Registry — India (CTRI) AYUSH Protocols** *(Documentation under review)*
  * National platform for registration of clinical trials. The AYUSH-specific documentation standards are actively updated by the council.

### In-Portal Walkthrough
* **AYUSH Startup Registration Guide** (`/how-it-works`)
  * Step-by-step walkthrough detailing registration wizard stages, mandatory document uploads (max 5 MB, PDF/JPG/PNG), review milestones, and tracking ID generation.

---

## 2. API Integration Details

The resources endpoints are publicly accessible and read from curated backend data:
* `GET /api/resources` — Paginated resource list with `category`, `search`, `sortBy`, `order`, `page`, and `limit` support.
* `GET /api/resources/:id` — Detail lookup for a single resource.

All responses follow the unified envelope:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 11,
      "totalPages": 2
    }
  }
}
```

---

## 3. Regulatory Disclaimer

> **IMPORTANT:** Links and resources provided in this portal are for administrative reference and guidance only. The AYUSH Startup Registration Portal does not issue statutory AYUSH manufacturing licenses or regulatory certifications under the Drugs and Cosmetics Act. Official manufacturing licenses must be sought directly from State Licensing Authorities (SLAs) or through the e-Aushadhi / FoSCoS portals.
