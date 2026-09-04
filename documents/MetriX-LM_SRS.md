# MetriX-LM : Digital OIML R 76 Test, Compliance and Report Management Platform for NAWI

**SIH 2026 | Problem Statement ID: 26035**

> **Project positioning:** A rules-driven, auditable laboratory workflow that captures type-evaluation observations, validates measurements, applies versioned OIML R 76 rules, explains PASS/FAIL decisions, and generates standardized test reports.

## Document Control

| Field               | Value                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Document ID         | SRS-26035-NAWI-01                                                                                       |
| Version             | 1.0                                                                                                     |
| Date                | 26 August 2026                                                                                          |
| Status              | Proposed / SIH Prototype Baseline                                                                       |
| Target              | Web-based application; responsive desktop-first                                                         |
| Primary Stack       | React + TypeScript + Node.js + Express + Supabase PostgreSQL                                            |
| Prepared for        | Smart India Hackathon 2026 – PS 26035                                                                  |
| Reference Standards | OIML R 76-1:2006 and OIML R 76-2:2007, subject to applicable national requirements and future revisions |

## Important Compliance Note

This SRS defines software requirements and a prototype architecture. It is not a legal interpretation of the Legal Metrology Act, rules, or OIML publications. All calculation rules, clause mappings, test applicability logic, report layouts, and approval workflows must be reviewed and validated by competent metrology/laboratory personnel before operational deployment.

## Architecture Decision: Supabase PostgreSQL for Production

The production system shall use **Supabase PostgreSQL** as its primary relational database. This is a better fit than MongoDB for the platform's linked entities, foreign-key relationships, searchable reporting data, laboratory scoping, approval transactions, immutable report snapshots and append-only audit trail. Supabase also provides managed PostgreSQL operations, migrations, backups, monitoring and row-level security primitives.

The repository's current `backend/data/db.json` implementation is a prototype/demo persistence adapter only. It is not suitable for production because it is process-local, does not support safe concurrent writes or horizontal scaling, and does not provide managed backup/restore or database-level authorization. The existing `supabase/migrations/` SQL schema is the starting point for the production persistence implementation, but it must be extended to cover the full SRS data model, tenant/laboratory isolation, authorization policies, audit immutability and evidence metadata.

MongoDB is retained as a considered alternative, not the selected architecture. It would be reasonable for a future design dominated by independent document aggregates, but it would add complexity for relational integrity, cross-entity reporting, approval locking and audit queries in this product. Any future database change must preserve the domain/service interfaces, migration history, report snapshots and audit semantics.

---

## Table of Contents

1. [Introduction and Purpose](#1-introduction-and-purpose)
2. [Background and Regulatory Context](#2-background-and-regulatory-context)
3. [Product Vision and Goals](#3-product-vision-and-goals)
4. [Scope](#4-scope)
5. [Stakeholders and User Roles](#5-stakeholders-and-user-roles)
6. [User Personas and Core Workflows](#6-user-personas-and-core-workflows)
7. [Functional Requirements](#7-functional-requirements)
8. [OIML Rules and Compliance Engine](#8-oiml-rules-and-compliance-engine)
9. [Data Validation and Measurement Integrity](#9-data-validation-and-measurement-integrity)
10. [Test Management Module](#10-test-management-module)
11. [Evidence and Document Management](#11-evidence-and-document-management)
12. [Review, Approval, Revision and Audit Trail](#12-review-approval-revision-and-audit-trail)
13. [Report Generation](#13-report-generation)
14. [Dashboard, Search and Analytics](#14-dashboard-search-and-analytics)
15. [AI-Assisted Capabilities](#15-ai-assisted-capabilities)
16. [Offline / Low-Connectivity Mode](#16-offline--low-connectivity-mode)
17. [Security and Privacy Requirements](#17-security-and-privacy-requirements)
18. [Non-Functional Requirements](#18-non-functional-requirements)
19. [System Architecture](#19-system-architecture)
20. [Technology Stack](#20-technology-stack)
21. [Data Model and Database Design](#21-data-model-and-database-design)
22. [API Requirements](#22-api-requirements)
23. [UI/UX Requirements](#23-uiux-requirements)
24. [Deployment and DevOps](#24-deployment-and-devops)
25. [Testing and Quality Assurance](#25-testing-and-quality-assurance)
26. [Acceptance Criteria](#26-acceptance-criteria)
27. [MVP / SIH Demo Scope](#27-mvp--sih-demo-scope)
28. [Future Enhancements](#28-future-enhancements)
29. [Risks, Constraints and Mitigations](#29-risks-constraints-and-mitigations)
30. [Traceability Matrix](#30-traceability-matrix)
31. [Glossary](#31-glossary)
32. [References](#32-references)
33. [Appendix A - Recommended Implementation Backlog](#appendix-a---recommended-implementation-backlog)
34. [Appendix B - Definition of Done for a Rule](#appendix-b---definition-of-done-for-a-rule)

---

# 1. Introduction and Purpose

## 1.1 Purpose

The purpose of this SRS is to define the requirements for a web-based application that supports the digital recording, validation, calculation, compliance evaluation, review, approval, storage and generation of test reports for Non-Automatic Weighing Instruments (NAWIs) evaluated in accordance with OIML R 76 and applicable Indian Legal Metrology requirements.

The product is intended to replace error-prone spreadsheet/document workflows with a controlled digital workflow. It must preserve traceability from instrument configuration and laboratory conditions through individual observations, calculations, compliance decisions, supporting evidence, reviewer actions and the final issued report.

## 1.2 Product Name

**Working name:** MetriX-LM (Legal Metrology Test & Compliance Platform)

The name is provisional and may be changed for SIH submission.

## 1.3 Intended Audience

- SIH judges and technical evaluators
- Legal Metrology laboratories / type-evaluation laboratories
- Laboratory technicians and test engineers
- Technical reviewers / approving officers
- Application administrators
- Software developers, QA engineers and DevOps engineers

## 1.4 Document Conventions

| Notation | Meaning                                                        |
| -------- | -------------------------------------------------------------- |
| FR       | Functional Requirement                                         |
| NFR      | Non-Functional Requirement                                     |
| BR       | Business/Regulatory Rule                                       |
| UI       | User Interface                                                 |
| API      | Application Programming Interface                              |
| MPE      | Maximum Permissible Error                                      |
| e        | Verification scale interval                                    |
| d        | Actual scale interval / displayed scale interval as applicable |
| RBAC     | Role-Based Access Control                                      |
| R76-1    | OIML R 76-1                                                    |
| R76-2    | OIML R 76-2                                                    |

---

# 2. Background and Regulatory Context

## 2.1 Legal Metrology Context

The Department of Consumer Affairs describes Legal Metrology as the application of legal requirements to measurements and measuring instruments, with objectives related to accuracy and public guarantee. Its current overview identifies model approval before manufacture/import, verification and stamping, Government Approved Test Centres and prescribed rules for weighing and measuring instruments.

For model approval, the Department notes that manufacturers/importers of prescribed weighing and measuring equipment are required to obtain approval of the Government of India before manufacturing/import.

## 2.2 OIML R 76 Relevance

OIML R 76-1:2006 specifies metrological and technical requirements and tests for non-automatic weighing instruments subject to official metrological control. The Recommendation is intended to standardize requirements and testing procedures in a uniform and traceable way.

OIML R 76-2:2007 defines a standardized type-evaluation report format for presenting results of tests described in R 76-1. It also emphasizes traceability information for test equipment and allows repeated tests and separate forms where appropriate.

OIML currently identifies R 76:2006 as the responsible Recommendation and has active project work for its revision. The system therefore requires a versioned rules architecture rather than permanently hard-coded calculations.

## 2.3 Regulatory Design Principle

> The software must never treat an AI model as the authoritative compliance decision-maker. Compliance calculations and PASS/FAIL outcomes must be generated by deterministic, testable and versioned rules. AI may assist with data extraction, explanations and search, subject to human verification.

---

# 3. Product Vision and Goals

## 3.1 Vision

Create a digital laboratory platform in which a NAWI model can move from registration to test completion, calculation, review and standardized report issuance through a single auditable workflow.

## 3.2 Primary Goals

- Reduce manual calculation and transcription errors.
- Standardize test data capture and report preparation.
- Make compliance results explainable and traceable to a versioned rule.
- Prevent invalid laboratory observations through domain-aware validation.
- Preserve complete audit history for data changes and approval actions.
- Support standardized PDF and editable report output.
- Provide instrument-wise test history and searchable records.
- Allow future OIML/national rule updates without redesigning the core application.
- Provide a strong SIH demonstration while maintaining a realistic pathway to productionization.

## 3.3 Success Metrics

| Metric               | Target for Prototype                      | Production-Oriented Target                |
| -------------------- | ----------------------------------------- | ----------------------------------------- |
| Report generation    | < 30 seconds for typical report           | < 10 seconds after data completion        |
| Calculation response | < 1 second for standard tests             | < 500 ms for rule calculations            |
| Validation coverage  | 100% of implemented prototype test fields | 100% of supported test procedures         |
| Audit coverage       | All high-risk edits/actions               | All material state changes                |
| Export formats       | PDF + DOCX                                | PDF + DOCX + print-ready archive          |
| Search               | Instrument/model/report search            | Compound search + filters + pagination    |
| Availability         | Best-effort demo environment              | >= 99.5% monthly application availability |

---

# 4. Scope

## 4.1 In Scope for the Platform

- User authentication, RBAC and laboratory organization management.
- Manufacturer, model and instrument master data.
- Type-evaluation case creation and lifecycle management.
- Laboratory and environmental condition capture.
- Configurable test procedures and observations.
- Deterministic calculation and OIML compliance rules.
- Domain-aware validation and error prevention.
- Evidence uploads including photos and supporting documents.
- Reviewer submission, approval/rejection and controlled revision workflow.
- Audit logs and immutable issued-report snapshots.
- Standardized report generation in PDF and editable DOCX formats.
- Dashboard, search, filters, report repository and test history.
- Versioned rules and report-template configuration.
- Optional AI-assisted document extraction and plain-language explanations.
- Optional offline/low-connectivity operation for assigned test sessions.

## 4.2 Out of Scope for MVP

- Direct control of weighing hardware or laboratory instruments.
- Automatic acquisition from every possible balance/indicator protocol.
- Legal issuance of a government model approval certificate unless an authorized integration is explicitly defined.
- Autonomous AI determination of compliance.
- Full coverage of every historical/national variation of OIML R 76 without domain validation.
- Native mobile applications.
- Public self-service access for manufacturers in the initial SIH prototype.

## 4.3 Scope Boundary

The product is a software workflow and evidence system around laboratory/type-evaluation activities. Physical testing remains under the control of qualified personnel and appropriate laboratory equipment. The application consumes observations and metadata, performs approved calculations, and produces traceable records and reports.

---

# 5. Stakeholders and User Roles

| Role                       | Primary Responsibilities                                          | Key Permissions                    |
| -------------------------- | ----------------------------------------------------------------- | ---------------------------------- |
| System Administrator       | Configure users, roles, laboratories, rule releases and templates | Full administrative access         |
| Lab Manager                | Manage cases, assign tests, monitor workload, review performance  | Create/assign/review/view          |
| Technician / Test Engineer | Enter instrument data, conditions, observations and evidence      | Create/edit assigned tests, submit |
| Technical Reviewer         | Verify observations, calculations, evidence and conclusions       | Review, return, approve            |
| Approving Authority        | Issue/lock final report or approval decision where configured     | Final approve/reject, lock         |
| Quality/Compliance Officer | Audit records, investigate revisions, monitor traceability        | Read audit logs, export evidence   |
| Viewer                     | Read permitted reports and dashboards                             | Read-only                          |

## 5.1 RBAC Principle

Every protected API endpoint must evaluate both the user role and the specific case/laboratory permission. UI hiding alone is insufficient. Unauthorized API access must return a controlled 401/403 response and be logged.

---

# 6. User Personas and Core Workflows

## 6.1 Technician Persona

Needs fast, guided data entry; clear units; immediate validation; easy attachment of evidence; ability to save drafts; and confidence that the software is applying the correct rules.

## 6.2 Reviewer Persona

Needs a consolidated view of test evidence, calculations, exceptions and audit trail; must be able to return a case with comments or approve it; needs confidence that the issued report exactly matches the approved data.

## 6.3 Administrator Persona

Needs configuration of laboratories, users, role permissions, rule versions, test templates, report templates and storage settings, with safeguards against accidental production changes.

## 6.4 End-to-End Workflow

```text
Login
  -> Create evaluation case
  -> Register manufacturer/model/instrument
  -> Configure OIML parameters
  -> Select/apply test workflow
  -> Record laboratory/environmental conditions
  -> Enter observations
  -> Automatic validation
  -> Deterministic calculation
  -> Compliance result
  -> Attach evidence
  -> Technician submit
  -> Reviewer verify/return/approve
  -> Report snapshot
  -> PDF/DOCX export
  -> Archive + searchable history
```

## 6.5 Exceptional Workflows

- **Invalid observation:** System blocks submission and shows the field, rule and reason.
- **Calculation failure:** Case moves to calculation exception state; no compliance decision is issued.
- **Reviewer return:** Technician receives reasoned comments and edits only permitted portions.
- **Approved correction:** Previous approved snapshot remains immutable; a new revision is created.
- **Rule update:** New cases use the selected/current applicable release; historic reports retain their rule-release identifier.
- **Upload failure:** Metadata remains safe; file can be retried without losing the test record.
- **Offline sync conflict:** Server state wins for immutable approvals; draft conflicts are surfaced for user resolution.

---

# 7. Functional Requirements

Priority: **P0 = must-have; P1 = high-value; P2 = future/optional.**

## 7.1 Authentication and User Management

| ID          | Pri | Requirement                                                                                                      |
| ----------- | --- | ---------------------------------------------------------------------------------------------------------------- |
| FR-AUTH-001 | P0  | The system shall support secure login/logout using short-lived access tokens and a controlled refresh mechanism. |
| FR-AUTH-002 | P0  | The system shall enforce RBAC for all protected resources.                                                       |
| FR-AUTH-003 | P0  | The system shall support user activation/deactivation without deleting historical actions.                       |
| FR-AUTH-004 | P1  | The system should support password reset and optional MFA for privileged roles.                                  |
| FR-AUTH-005 | P0  | All material authentication and authorization failures shall be logged.                                          |

## 7.2 Laboratory and Master Data

| ID            | Pri | Requirement                                                                                                                                                    |
| ------------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-MASTER-001 | P0  | Admin shall create and maintain laboratories, addresses, contacts and report identifiers.                                                                      |
| FR-MASTER-002 | P0  | System shall maintain manufacturer master records with unique identifiers.                                                                                     |
| FR-MASTER-003 | P0  | System shall maintain model records linked to manufacturers and instrument families.                                                                           |
| FR-MASTER-004 | P0  | Model configuration shall support Max, Min, e, d, accuracy class, number of verification scale intervals, units and applicable characteristics where required. |
| FR-MASTER-005 | P1  | System shall support configurable test equipment master data and traceability identifiers.                                                                     |

## 7.3 Evaluation Case Management

| ID          | Pri | Requirement                                                                                                   |
| ----------- | --- | ------------------------------------------------------------------------------------------------------------- |
| FR-CASE-001 | P0  | User shall create a unique type-evaluation case with status, case number, date and responsible laboratory.    |
| FR-CASE-002 | P0  | System shall support draft, in-progress, submitted, returned, approved, rejected, issued and archived states. |
| FR-CASE-003 | P0  | System shall prevent an approved/issued case from being silently edited.                                      |
| FR-CASE-004 | P0  | System shall store case-level metadata and link every test, evidence item and report to the case.             |
| FR-CASE-005 | P1  | System shall allow assignment of cases/tests to technicians and reviewers.                                    |

## 7.4 Test Data Capture

| ID          | Pri | Requirement                                                                                                   |
| ----------- | --- | ------------------------------------------------------------------------------------------------------------- |
| FR-TEST-001 | P0  | System shall provide structured forms for instrument details, environmental conditions and test observations. |
| FR-TEST-002 | P0  | Each numeric field shall define an allowed unit, precision and validation rule.                               |
| FR-TEST-003 | P0  | System shall support repeated observations and preserve sequence/order where the procedure requires it.       |
| FR-TEST-004 | P0  | System shall allow comments and evidence at test and observation level.                                       |
| FR-TEST-005 | P1  | System shall support dynamic test forms selected from a versioned test-procedure catalogue.                   |

## 7.5 Compliance and Calculations

| ID          | Pri | Requirement                                                                                                            |
| ----------- | --- | ---------------------------------------------------------------------------------------------------------------------- |
| FR-COMP-001 | P0  | System shall apply a deterministic calculation engine to every implemented compliance test.                            |
| FR-COMP-002 | P0  | Every calculated result shall include input values, derived values, units, rule ID/release and result status.          |
| FR-COMP-003 | P0  | System shall distinguish PASS, FAIL, NOT APPLICABLE, INCOMPLETE and CALCULATION_EXCEPTION states.                      |
| FR-COMP-004 | P0  | System shall block final PASS/FAIL when required inputs are missing or invalid.                                        |
| FR-COMP-005 | P1  | System shall expose a human-readable explanation of the compliance decision without changing the authoritative result. |

## 7.6 Evidence and Documents

| ID          | Pri | Requirement                                                                                           |
| ----------- | --- | ----------------------------------------------------------------------------------------------------- |
| FR-EVID-001 | P0  | User shall upload photographs, certificates and supporting documents against a case/test/observation. |
| FR-EVID-002 | P0  | System shall validate allowed file types, size and malware/security policy before accepting files.    |
| FR-EVID-003 | P1  | Evidence metadata shall include uploader, timestamp, category and related record.                     |
| FR-EVID-004 | P0  | Issued reports shall reference the exact evidence set used at approval time.                          |

## 7.7 Review and Approval

| ID            | Pri | Requirement                                                                                 |
| ------------- | --- | ------------------------------------------------------------------------------------------- |
| FR-REVIEW-001 | P0  | Technician shall be able to submit a completed case to a reviewer.                          |
| FR-REVIEW-002 | P0  | Reviewer shall see all required tests, calculations, exceptions, evidence and audit events. |
| FR-REVIEW-003 | P0  | Reviewer shall approve or return a case with mandatory comments for rejection/return.       |
| FR-REVIEW-004 | P0  | Final approval shall create an immutable report snapshot/hashable artifact state.           |
| FR-REVIEW-005 | P1  | Digital signature support shall be configurable and optional.                               |

## 7.8 Reporting

| ID            | Pri | Requirement                                                                                                                                                         |
| ------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-REPORT-001 | P0  | System shall generate a standardized report from approved data.                                                                                                     |
| FR-REPORT-002 | P0  | System shall export PDF.                                                                                                                                            |
| FR-REPORT-003 | P1  | System shall export editable DOCX.                                                                                                                                  |
| FR-REPORT-004 | P0  | Report shall include case/instrument information, laboratory conditions, test observations, calculations, results, evidence references and approvals as configured. |
| FR-REPORT-005 | P0  | Historic reports shall remain reproducible from their immutable snapshot or stored rendered artifact.                                                               |

## 7.9 Search and Dashboard

| ID            | Pri | Requirement                                                                               |
| ------------- | --- | ----------------------------------------------------------------------------------------- |
| FR-SEARCH-001 | P0  | System shall search by case number, manufacturer, model, serial number, status and date.  |
| FR-SEARCH-002 | P1  | System should support advanced filtering and pagination.                                  |
| FR-DASH-001   | P0  | Dashboard shall show test workload by status.                                             |
| FR-DASH-002   | P1  | Dashboard should show failure categories, turnaround time and laboratory workload trends. |

## 7.10 Audit and History

| ID         | Pri | Requirement                                                                                                       |
| ---------- | --- | ----------------------------------------------------------------------------------------------------------------- |
| FR-AUD-001 | P0  | System shall record creation, modification, submission, review, approval, export and deletion-related actions.    |
| FR-AUD-002 | P0  | Audit entries shall include actor, timestamp, record, action and relevant before/after summary where appropriate. |
| FR-AUD-003 | P0  | Audit log shall be append-only from application users.                                                            |
| FR-AUD-004 | P0  | Historic approved reports shall retain the rule-release identifier used to calculate results.                     |

---

# 8. OIML Rules and Compliance Engine

## 8.1 Objective

The rules engine is the core differentiator of the platform. It converts approved domain specifications into deterministic software rules and provides an auditable explanation for every result.

## 8.2 Design Principles

- Rules are data/configuration first where practical, not duplicated throughout UI code.
- Each rule has an explicit standard identifier, clause/reference, version/release, effective date, applicability conditions, inputs, units, formula/logic description, rounding policy and test mapping.
- Calculation functions are pure and unit tested.
- No compliance result is produced from an LLM response.
- Rule updates create a new release; they do not mutate historic calculation results.
- A domain expert must approve rule releases before they can be used for production evaluation.

## 8.3 Conceptual Rule Schema

```json
{
  "standard": "OIML R 76-1",
  "release": "2006",
  "ruleId": "R76-MPE-...",
  "clauseRef": "...",
  "testType": "weighing_performance",
  "applicability": {},
  "inputs": [],
  "unitPolicy": {},
  "logic": {},
  "roundingPolicy": {},
  "status": "approved"
}
```

## 8.4 Calculation Pipeline

```text
Raw observation
  -> schema validation
  -> unit normalization
  -> domain validation
  -> rule selection
  -> calculation
  -> rounding/display policy
  -> comparison
  -> compliance status
  -> explanation
  -> immutable result record
```

## 8.5 Required Result Fields

| Field            | Purpose                                       |
| ---------------- | --------------------------------------------- |
| inputSnapshot    | Exact input values used                       |
| normalizedInputs | Values normalized to canonical units          |
| calculationTrace | Derived calculations and intermediate values  |
| ruleRelease      | Exact ruleset/release                         |
| ruleRefs         | Clause/rule identifiers                       |
| result           | Numeric/qualitative outcome                   |
| allowedLimit     | Applicable threshold/tolerance where relevant |
| status           | PASS/FAIL/N/A/INCOMPLETE/EXCEPTION            |
| explanation      | Human-readable reason                         |
| engineVersion    | Software calculation-engine version           |
| calculatedAt     | Timestamp                                     |

## 8.6 Initial Test Modules for SIH Prototype

- Instrument configuration and parameter validation.
- Weighing performance / error evaluation for selected representative cases.
- Repeatability.
- Eccentric loading.
- Zero-setting / tare-related checks where applicable.
- Selected influence-condition/environmental checks supported by the prototype.
- Overall test-case aggregation and final compliance summary.

The exact test catalogue and numerical formulas must be verified directly against the official applicable OIML edition and national requirements before implementation.

## 8.7 Example of Explainable Result

> **Example only — not a normative formula:** Observed error = +X; applicable permissible error = +/-Y; comparison result = FAIL because |X| > Y. The UI shall also display the exact rule release and clause reference configured in the validated ruleset.

---

# 9. Data Validation and Measurement Integrity

## 9.1 Validation Layers

| Layer                  | Checks                                                         | Outcome                     |
| ---------------------- | -------------------------------------------------------------- | --------------------------- |
| UI schema              | Required fields, format, numeric type, unit selection          | Immediate field feedback    |
| API schema             | Payload structure, allowed enum values, authorization          | Reject invalid request      |
| Domain validation      | Range, consistency, relationship between instrument parameters | Block or flag               |
| Rule applicability     | Whether test/rule applies to configured instrument             | N/A or required             |
| Calculation validation | Formula inputs, divide-by-zero, overflow, missing input        | Calculation exception       |
| Workflow validation    | Mandatory tests/evidence/reviewer conditions                   | Prevent submission/approval |

## 9.2 Unit Handling

- Each numeric value shall carry a unit or be associated with an explicit case-level unit context.
- Internal calculations shall use canonical units to avoid mixed-unit errors.
- Conversions shall be deterministic and tested.
- Displayed precision shall be separated from stored numeric precision.
- Rounding must follow the approved test/rule specification and shall not be used to hide a failed raw comparison.

## 9.3 Invalid Data Examples

- Load greater than configured maximum capacity where the procedure does not permit it.
- Missing verification scale interval required by a calculation.
- Negative observation where the test field definition prohibits it.
- Environmental value outside the test procedure input range.
- Conflicting model parameters such as inconsistent interval/capacity configuration.
- Duplicate test sequence numbers where uniqueness is required.

---

# 10. Test Management Module

## 10.1 Test Template Model

A test procedure shall be represented as metadata + input schema + applicability logic + calculation/rule mapping + evidence requirements + report mapping. This makes the UI dynamic and reduces the need to create one bespoke React screen for every future test.

| Component         | Example                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| Test ID           | TEST-WP-001                                                              |
| Name              | Weighing performance                                                     |
| Inputs            | Load, reference value, indication, environmental condition as applicable |
| Outputs           | Error, permissible error, result                                         |
| Repeatable        | Yes                                                                      |
| Evidence required | Optional/Configurable                                                    |
| Rule mapping      | One or more approved R76 rules                                           |
| Report section    | Corresponding type-evaluation report section                             |

## 10.2 Test Status State Machine

```text
NOT_STARTED
  -> IN_PROGRESS
  -> VALIDATION_ERROR
  -> IN_PROGRESS
  -> COMPLETED

COMPLETED
  -> SUBMITTED
  -> UNDER_REVIEW
  -> RETURNED
  -> IN_PROGRESS

UNDER_REVIEW
  -> APPROVED
  -> REPORT_ISSUED
  -> ARCHIVED

UNDER_REVIEW
  -> REJECTED
  -> CLOSED
```

## 10.3 Dynamic Workflow Generation

When a case is configured, the system evaluates applicability rules and generates the required test set. The user sees mandatory, optional, not-applicable and conditionally-required tests with reasons. A reviewer can see which rules caused each test to be included.

---

# 11. Evidence and Document Management

## 11.1 Evidence Types

- Instrument photographs
- Nameplate photographs
- Test setup photographs
- Calibration certificates / traceability documents
- Manufacturer technical documents
- Laboratory worksheets
- Signed approvals
- Supporting PDFs and images
- Generated report artifact

## 11.2 Evidence Metadata

| Field                         | Required    |
| ----------------------------- | ----------- |
| Evidence ID                   | Yes         |
| File storage key              | Yes         |
| Original filename             | Yes         |
| MIME type                     | Yes         |
| Size                          | Yes         |
| Hash/checksum                 | Recommended |
| Uploader                      | Yes         |
| Timestamp                     | Yes         |
| Related case/test/observation | Yes         |
| Description/category          | Yes         |
| Retention class               | Recommended |

## 11.3 File Security

- Allow-list file types; reject executable content.
- Apply maximum upload size per file and per case.
- Use signed/private storage URLs where possible.
- Perform malware scanning where production infrastructure permits.
- Sanitize filenames and metadata.
- Never expose storage credentials to the browser.

---

# 12. Review, Approval, Revision and Audit Trail

## 12.1 Review Checklist

- All required test procedures completed.
- No unresolved validation errors.
- Rule calculations completed successfully.
- Evidence requirements satisfied.
- Exceptions/overrides documented.
- Reviewer sees the exact case snapshot under review.
- Final decision is captured with actor and timestamp.

## 12.2 Controlled Revision

Once a case is approved/issued, its result snapshot must be immutable. A correction uses a new revision linked to the previous revision. The system shall preserve the predecessor relationship, reason for revision and user who initiated it.

## 12.3 Audit Log Event Model

| Property           | Example                         |
| ------------------ | ------------------------------- |
| Actor              | user_123                        |
| Action             | UPDATE_OBSERVATION              |
| Entity             | Observation obs_456             |
| Before             | +0.04                           |
| After              | +0.14                           |
| Reason             | Corrected from lab worksheet    |
| Timestamp          | UTC timestamp                   |
| Correlation ID     | request/transaction ID          |
| IP/device metadata | Configurable, subject to policy |

---

# 13. Report Generation

## 13.1 Report Principles

- Report generation must use an approved template corresponding to the rule/report release.
- The report must be generated from an immutable approved snapshot rather than live editable data.
- Page numbering, section ordering and repeated test pages should be template-driven.
- The report should include sufficient traceability to test equipment and evidence as configured by the applicable format.

## 13.2 Output Formats

| Output          | Technology                         | Priority |
| --------------- | ---------------------------------- | -------- |
| PDF             | Puppeteer/Chromium HTML-to-PDF     | P0       |
| DOCX            | docx library / template generation | P1       |
| Print           | Browser print CSS / PDF            | P1       |
| Evidence bundle | ZIP with manifest and hashes       | P2       |

## 13.3 Report Contents

- Cover/general information
- Applicant/manufacturer/model information
- Instrument technical parameters
- Laboratory and test equipment details
- Environmental conditions
- Applicable test catalogue
- Individual test observations
- Calculated values and compliance status
- Exceptions/deviations
- Evidence index
- Reviewer/approval information
- Report revision and ruleset identifiers

---

# 14. Dashboard, Search and Analytics

## 14.1 Dashboard Cards

- Active evaluations
- Pending technician actions
- Pending reviews
- Approved/issued reports
- Failed/returned tests
- Cases by status
- Average turnaround time
- Tests by instrument family

## 14.2 Search

Minimum searchable keys:

- Case number
- Manufacturer
- Model
- Instrument serial number
- Model approval number where applicable
- Status
- Technician
- Reviewer
- Date range

Search shall be case-insensitive and paginated.

## 14.3 Analytics

- Pass/fail distribution by test type
- Top validation failures
- Most common compliance failures
- Average time per test case
- Reviewer workload
- Instrument/model test history
- Rule-release usage

---

# 15. AI-Assisted Capabilities

## 15.1 AI Policy

AI is an assistant, not a compliance authority. The application must clearly label AI-generated output and require user verification for extracted technical parameters or interpretations.

## 15.2 Candidate AI Features

| Feature                  | Input                                    | Output                       | Guardrail                          |
| ------------------------ | ---------------------------------------- | ---------------------------- | ---------------------------------- |
| Specification extraction | Manufacturer PDF/image                   | Candidate model parameters   | Human verifies before save         |
| Test explanation         | Deterministic result + calculation trace | Plain-language explanation   | Must not modify result             |
| Document classification  | Uploaded evidence                        | Suggested category           | User confirms category             |
| Natural-language search  | Authorized records                       | Search/filter interpretation | No unauthorized retrieval          |
| Report summarization     | Approved report                          | Executive summary            | Clearly labelled generated content |

## 15.3 AI Failure Fallback

If the AI provider is unavailable, the application continues all core functions: data entry, validation, deterministic calculations, review and report generation. AI-dependent fields remain manual or optional.

---

# 16. Offline / Low-Connectivity Mode

## 16.1 Objective

Enable assigned test sessions to continue during intermittent connectivity without allowing offline users to alter immutable approvals or authoritative rules.

## 16.2 Prototype Approach

- Preload assigned case data and the approved ruleset version.
- Store draft observations locally in encrypted browser storage where feasible.
- Mark offline-created records as pending synchronization.
- On reconnect, validate against the server ruleset and resolve conflicts.
- Do not permit offline final approval/issuance.

## 16.3 Future Production Approach

A production version may use a service worker + local database such as IndexedDB, a sync queue and explicit conflict-resolution semantics.

---

# 17. Security and Privacy Requirements

| ID      | Requirement                                                                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------------------- |
| SEC-001 | All external traffic shall use TLS/HTTPS.                                                                                  |
| SEC-002 | Passwords shall be hashed using a modern password-hashing algorithm; plain-text storage is prohibited.                     |
| SEC-003 | Secrets/API keys shall be stored in environment/secret management, never source control.                                   |
| SEC-004 | RBAC and resource-level authorization shall be enforced server-side.                                                       |
| SEC-005 | Uploaded files shall be private by default.                                                                                |
| SEC-006 | API rate limits shall be applied to authentication and expensive operations.                                               |
| SEC-007 | Input shall be validated server-side to mitigate injection and malformed payloads.                                         |
| SEC-008 | Audit logs shall be protected from ordinary user modification.                                                             |
| SEC-009 | Production database backups shall be encrypted and tested for restore.                                                     |
| SEC-010 | Sensitive operational data shall have defined retention and deletion policies.                                             |
| SEC-011 | AI API calls shall be restricted to approved data fields; unnecessary personal/confidential information shall not be sent. |
| SEC-012 | Security events shall be centrally logged and monitored.                                                                   |

---

# 18. Non-Functional Requirements

| ID            | Category        | Requirement / Target                                                                    |
| ------------- | --------------- | --------------------------------------------------------------------------------------- |
| NFR-PERF-001  | Performance     | Typical calculation response <= 1 s under prototype load.                               |
| NFR-PERF-002  | Performance     | Typical report generation <= 30 s for a normal evaluation case.                         |
| NFR-PERF-003  | Performance     | List/search endpoints use pagination and indexed fields.                                |
| NFR-SCALE-001 | Scalability     | Backend shall be stateless where possible so API instances can scale horizontally.      |
| NFR-REL-001   | Reliability     | Failed report generation shall not corrupt the approved case.                           |
| NFR-REL-002   | Reliability     | Database writes affecting approval shall be transactional/atomic where supported.       |
| NFR-SEC-001   | Security        | OWASP-aligned secure development practices shall be followed.                           |
| NFR-AUD-001   | Auditability    | Material state changes shall be traceable to an authenticated actor.                    |
| NFR-UX-001    | Usability       | Technician can save a draft without losing entered data.                                |
| NFR-ACC-001   | Accessibility   | Forms shall support keyboard navigation, readable labels and accessible error messages. |
| NFR-MAINT-001 | Maintainability | Calculation rules shall be unit-testable independent of controllers/UI.                 |
| NFR-MAINT-002 | Maintainability | API, domain and UI layers shall have clear boundaries.                                  |
| NFR-PORT-001  | Portability     | Application shall be containerizable with Docker.                                       |
| NFR-OBS-001   | Observability   | Structured logs, health endpoint and error correlation IDs shall be available.          |
| NFR-BACK-001  | Recovery        | Backup/restore procedure shall be documented for production.                            |

---

# 19. System Architecture

```text
+-----------------------------+
| React + TypeScript Web UI   |
+--------------+--------------+
               |
          HTTPS / JSON
               |
+--------------v--------------+
| Express API / Auth / RBAC   |
+--------------+--------------+
               |
      +--------+--------+----------------+
      |                 |                |
+-----v------+    +-----v------+   +-----v------+
| Case/Test  |    | Rules/Calc |   | Report     |
| Services  |    | Engine      |   | Engine     |
+-----+------+    +-----+------+   | PDF/DOCX   |
      |                 |          +-----+------+
      +-----------------+----------------+
                        |
               +--------v---------+
               | Supabase         |
               | PostgreSQL       |
               +--------+---------+
                        |
            +-----------+-----------+
            |                       |
      +-----v------+          +-----v------+
      | Object     |          | Audit/Logs |
      | Storage    |          | /Observ.   |
      | Photos/    |          +------------+
      | Files      |
      +------------+

Optional AI service sits beside, not inside, the compliance engine.
```

## 19.1 Layering Rules

- **Presentation layer:** forms, dashboards, report preview.
- **API layer:** request validation, authentication, authorization, DTOs.
- **Application/service layer:** use cases and workflows.
- **Domain layer:** test definitions, calculations, compliance rules, state transitions.
- **Persistence layer:** Supabase PostgreSQL repositories and migrations.
- **Infrastructure layer:** storage, email, AI provider, PDF rendering, logging.

## 19.2 Recommended Repository Structure

```text
apps/web
apps/api
packages/domain
packages/rules
packages/schemas
packages/reporting
packages/ui
infra/docker
docs/rulesets
tests/unit
tests/integration
tests/e2e
```

---

# 20. Technology Stack

| Layer          | Technology                                    | Reason                                                                 |
| -------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| Frontend       | React + TypeScript + Vite                     | Team familiarity, fast UI development, type safety                     |
| UI             | Tailwind CSS + shadcn/ui                      | Consistent professional UI with accessible primitives                  |
| Forms          | React Hook Form + Zod                         | Structured validation and schema reuse                                 |
| Data fetching  | TanStack Query                                | Caching, retries and API state management                              |
| Charts         | Recharts                                      | Dashboard visualizations                                               |
| Backend        | Node.js + Express + TypeScript                | MERN fit and strong ecosystem                                          |
| Database       | Supabase PostgreSQL                           | Relational integrity, transactions, reporting queries, backups and RLS |
| Auth           | JWT + bcrypt/Argon2                           | Standard API auth pattern                                              |
| Object storage | S3-compatible / Cloudinary / Supabase Storage | Evidence file storage                                                  |
| PDF            | Puppeteer                                     | HTML/CSS report templates to PDF                                       |
| DOCX           | docx package                                  | Editable Word output                                                   |
| AI optional    | Gemini/Groq/OpenAI-compatible service         | Extraction/explanation/search assistant                                |
| Testing        | Vitest/Jest + Supertest + Playwright          | Unit/API/E2E coverage                                                  |
| DevOps         | Docker + GitHub Actions                       | Repeatable local/CI builds                                             |
| Deployment     | Render/Railway/AWS/VPS + Supabase             | Managed database with controlled API and worker infrastructure         |

---

# 21. Data Model and Database Design

## 21.1 Core Entities

| Entity            | Key Fields                                                                            |
| ----------------- | ------------------------------------------------------------------------------------- |
| User              | id, name, email, passwordHash, roleIds, laboratoryIds, active, createdAt              |
| Laboratory        | id, name, address, identifiers, reportSettings                                        |
| Manufacturer      | id, legalName, tradeName, address, contacts                                           |
| InstrumentModel   | id, manufacturerId, modelName, family, max, min, e, d, accuracyClass, units, metadata |
| EvaluationCase    | id, caseNo, modelId, serialNo, labId, status, assignedUsers, ruleReleaseId            |
| TestDefinition    | id, code, version, applicability, schema, ruleMappings, reportMapping                 |
| TestExecution     | id, caseId, testDefinitionId, status, inputs, observations, results, evidenceIds      |
| RuleRelease       | id, standard, release, status, approvedBy, effectiveFrom, rules                       |
| CalculationResult | id, executionId, inputs, normalizedInputs, trace, status, explanation, engineVersion  |
| Evidence          | id, caseId, testId, fileKey, hash, metadata                                           |
| ReportTemplate    | id, standardRelease, version, sections, status                                        |
| ReportSnapshot    | id, caseId, revision, dataHash, ruleReleaseId, reportTemplateId, artifactKeys         |
| AuditEvent        | id, actorId, action, entityType, entityId, before, after, reason, timestamp           |
| AIJob             | id, caseId, type, provider, inputRef, output, confidence, reviewStatus                |

## 21.2 Key Relationships

```text
Manufacturer 1---N InstrumentModel
InstrumentModel 1---N EvaluationCase
EvaluationCase 1---N TestExecution
TestDefinition 1---N TestExecution
TestExecution 1---N CalculationResult
EvaluationCase 1---N Evidence
EvaluationCase 1---N ReportSnapshot
EvaluationCase 1---N AuditEvent
RuleRelease 1---N TestDefinition / CalculationResult / ReportSnapshot
```

## 21.3 Indexes

- **EvaluationCase:** caseNo unique; serialNo; status; labId; createdAt.
- **InstrumentModel:** manufacturerId + modelName.
- **AuditEvent:** entityType + entityId + timestamp.
- **ReportSnapshot:** caseId + revision.
- **TestExecution:** caseId + status.

---

# 22. API Requirements

## 22.1 Endpoint Groups

| Method    | Endpoint                            | Purpose                       |
| --------- | ----------------------------------- | ----------------------------- |
| POST      | `/api/auth/login`                 | Login                         |
| POST      | `/api/auth/refresh`               | Refresh session               |
| GET       | `/api/me`                         | Current user                  |
| GET/POST  | `/api/manufacturers`              | Manufacturer master           |
| GET/POST  | `/api/models`                     | Instrument models             |
| POST/GET  | `/api/cases`                      | Create/list cases             |
| GET/PATCH | `/api/cases/:id`                  | Case detail/update            |
| GET       | `/api/cases/:id/tests`            | Case test workflow            |
| POST      | `/api/tests/:id/observations`     | Add/update observation        |
| POST      | `/api/tests/:id/calculate`        | Run deterministic calculation |
| POST      | `/api/cases/:id/submit`           | Submit for review             |
| POST      | `/api/cases/:id/review`           | Approve/return/reject         |
| POST      | `/api/cases/:id/reports/generate` | Generate report               |
| GET       | `/api/reports/:id/download`       | Download report               |
| POST      | `/api/evidence/upload`            | Upload evidence               |
| GET       | `/api/audit`                      | Search audit log              |
| GET       | `/api/dashboard/summary`          | Dashboard data                |

## 22.2 API Rules

- All write APIs shall validate input with shared schemas.
- API shall return consistent error envelopes with code, message, field errors and correlation ID.
- Pagination parameters shall be bounded.
- Sort fields shall be allow-listed.
- Sensitive data must not be returned unnecessarily.
- Calculation APIs should be idempotent for the same input snapshot and ruleset.

---

# 23. UI/UX Requirements

## 23.1 Navigation

```text
Dashboard | Cases | Instruments | Manufacturers | Tests | Reports | Evidence | Audit | Admin
```

## 23.2 Main Screens

- Login
- Dashboard
- Case list/search
- Create evaluation wizard
- Instrument/model configuration
- Test execution workspace
- Calculation/explanation drawer
- Evidence manager
- Reviewer workspace
- Report preview and export
- Instrument digital passport/history
- Audit trail
- Admin/rules/template configuration

## 23.3 Test Workspace Design

Use a left-side test navigation and a main workspace. The progress view should distinguish complete, incomplete, failed validation and not-applicable tests. Save status and last-saved timestamp should be visible. Validation messages should identify the problem and the corrective action.

## 23.4 Accessibility

- Labels associated with all form controls.
- Keyboard-accessible interactive controls.
- Error text not conveyed by color alone.
- Readable contrast.
- Clear focus indicators.
- Descriptive confirmation/exception messages.

---

# 24. Deployment and DevOps

## 24.1 Environments

| Environment     | Purpose                                  |
| --------------- | ---------------------------------------- |
| Local           | Developer work                           |
| Development     | Shared integration                       |
| Staging         | Pre-demo / QA environment                |
| Production/demo | SIH presentation / controlled deployment |

## 24.2 Docker Services

```text
web     -> React static build served by CDN/Nginx
api     -> Node/Express container
database -> Supabase-managed PostgreSQL; local PostgreSQL/Supabase CLI for development
storage -> Supabase Storage or private S3-compatible storage
worker  -> optional report/AI/background-job container
```

## 24.3 CI Pipeline

```text
Commit
  -> lint
  -> typecheck
  -> unit tests
  -> API tests
  -> build
  -> container build
  -> security checks
  -> deploy staging
  -> smoke test
```

## 24.4 Observability

- Structured JSON logs
- Request correlation ID
- API latency/error metrics
- Report generation success/failure metric
- Ruleset execution counts
- Authentication failures
- Health/readiness endpoints

---

# 25. Testing and Quality Assurance

## 25.1 Test Levels

| Level       | Coverage                                                                     |
| ----------- | ---------------------------------------------------------------------------- |
| Unit        | Calculations, unit conversion, validation, state transitions, rule selection |
| Integration | API + Supabase PostgreSQL + object storage adapters                          |
| Contract    | Request/response schema compatibility                                        |
| E2E         | Technician-to-report and reviewer workflows                                  |
| Security    | Auth, RBAC, file upload, injection, rate limits                              |
| Performance | Case search, calculations, report generation                                 |
| Regression  | Known test vectors for every rule release                                    |
| UAT         | Metrology expert verification of workflows and outputs                       |

## 25.2 Calculation Test Strategy

- Use independently verified test vectors.
- Include boundary values around each permissible threshold.
- Include positive, negative and zero cases where meaningful.
- Test unit conversions and precision separately.
- Test missing/invalid inputs.
- Test rule version changes.
- Store expected result, explanation and rule reference for regression tests.

## 25.3 Security Test Strategy

- Attempt horizontal privilege escalation between laboratories.
- Attempt vertical privilege escalation from technician to reviewer/admin.
- Test expired/invalid tokens.
- Test malicious upload names/types/content.
- Test SQL injection and malformed query/filter patterns.
- Test XSS in free-text fields and report templates.
- Test rate limiting on login and expensive endpoints.

---

# 26. Acceptance Criteria

| ID     | Acceptance Criterion                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- |
| AC-001 | A technician can create a case, configure an instrument and obtain a generated test workflow.   |
| AC-002 | Implemented test modules reject missing/invalid inputs with actionable validation messages.     |
| AC-003 | The calculation engine returns deterministic results for all approved prototype test vectors.   |
| AC-004 | Every compliance result shows the applicable rule release and calculation trace.                |
| AC-005 | A test observation can be linked to evidence and audit metadata.                                |
| AC-006 | A technician can submit a completed case and a reviewer can return or approve it.               |
| AC-007 | Approved data cannot be silently edited; corrections create a revision.                         |
| AC-008 | System generates a consistent PDF report from an approved snapshot.                             |
| AC-009 | System supports search by case/model/serial number/status/date.                                 |
| AC-010 | Dashboard reflects case status counts accurately.                                               |
| AC-011 | A future rule release can coexist with historic results without recalculating historic reports. |
| AC-012 | AI outage does not block deterministic testing, review or report generation.                    |
| AC-013 | Unauthorized users cannot read/write data outside their scope.                                  |
| AC-014 | A failed report-generation attempt leaves the approved case unchanged.                          |

---

# 27. Statement for Difference

## 27.1 Differentiation Statement

> Most implementations can digitize forms and produce PDFs. This solution focuses on a domain-aware compliance workflow: dynamic test selection, deterministic and explainable calculations, evidence-linked observations, controlled approval, immutable revisions, versioned standards and complete auditability.

---

# 28. Future Enhancements

- Full R76 test catalogue coverage after domain validation.
- Support for additional national/regional regulatory profiles.
- Direct hardware/indicator integration using approved protocols.
- Barcode/QR scanning for instruments and evidence.
- Electronic signatures and certificate integration.
- Advanced offline synchronization.
- Laboratory instrument calibration/asset management integration.
- Automated quality-control sampling and review queues.
- Cross-laboratory analytics with strict tenant isolation.
- Mobile/tablet technician application.
- AI-assisted extraction from scanned legacy worksheets.
- Integration with government portals only where officially authorized and technically available.

---

# 29. Risks, Constraints and Mitigations

| Risk                                   | Impact   | Likelihood | Mitigation                                                                                            |
| -------------------------------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| Incorrect interpretation of OIML rules | Critical | Medium     | Use official documents, create rule specification, verify with metrology expert and known vectors.    |
| Over-scoping all R76 tests             | High     | High       | Build representative high-quality modules; use extensible rule/test architecture.                     |
| Report mismatch with required format   | High     | Medium     | Map each report field/section explicitly to approved template and validate with reviewers.            |
| AI hallucination                       | High     | Medium     | Never use AI for authoritative calculations; human verification for extraction.                       |
| Data security failure                  | Critical | Low/Med    | RBAC, private storage, TLS, secret management, audit, security testing.                               |
| Offline sync complexity                | Medium   | Medium     | Keep offline mode prototype-limited; no offline approval.                                             |
| Poor demo performance                  | Medium   | Medium     | Precompute/test report templates, index database, use realistic fixture data.                         |
| Rule changes after development         | High     | High       | Versioned rules/reports; maintain a rule release workflow.                                            |
| Dependence on external AI/cloud        | Medium   | Medium     | Core workflow operates without AI; storage abstraction layer.                                         |
| Lack of domain expert                  | Critical | Medium     | Seek review from Legal Metrology/metrology faculty/lab expert before claiming regulatory correctness. |

---

# 30. Traceability Matrix

| Problem-Statement Need                     | System Response                              | Requirement IDs        | Demo Evidence            |
| ------------------------------------------ | -------------------------------------------- | ---------------------- | ------------------------ |
| Capture instrument details/specifications  | Instrument/model master + case configuration | FR-MASTER-003/004      | Create instrument        |
| Record laboratory/environmental conditions | Case/test condition forms                    | FR-TEST-001            | Condition entry          |
| Enter observations                         | Structured test execution                    | FR-TEST-001/003        | Run test                 |
| Calculate permissible errors/compliance    | Deterministic rules engine                   | FR-COMP-001/002/003    | Explainable PASS/FAIL    |
| Validation checks                          | Multi-layer domain validation                | FR-COMP-004            | Invalid input demo       |
| Generate standardized reports              | Template-driven PDF/DOCX                     | FR-REPORT-001..005     | Generate report          |
| Repository/history                         | Cases + reports + digital passport           | FR-SEARCH-001/002      | Search history           |
| Role-based access                          | JWT + RBAC                                   | FR-AUTH-001/002        | Technician/reviewer demo |
| Future updates                             | Versioned rules and report templates         | FR-AUD-004 + Section 8 | Show rule release        |
| Photographs/supporting docs                | Evidence storage and linking                 | FR-EVID-001..004       | Upload evidence          |
| Dashboard                                  | Status/workload analytics                    | FR-DASH-001/002        | Dashboard                |
| Digital signatures optional                | Configurable approval/signature module       | FR-REVIEW-005          | Optional future toggle   |

---

# 31. Glossary

| Term            | Definition                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAWI            | Non-Automatic Weighing Instrument; an instrument for which an operator intervention is required during the weighing process as applicable to the scope of R 76. |
| OIML            | International Organization of Legal Metrology.                                                                                                                  |
| R 76-1          | OIML Recommendation R 76-1:2006, covering metrological and technical requirements and tests for NAWIs.                                                          |
| R 76-2          | OIML Recommendation R 76-2:2007, providing a standardized type-evaluation report format.                                                                        |
| MPE             | Maximum Permissible Error under the applicable rule/test condition.                                                                                             |
| e               | Verification scale interval used in the applicable metrological requirements.                                                                                   |
| d               | Actual scale interval/displayed scale interval parameter as applicable.                                                                                         |
| Type evaluation | Evaluation of a model/type against applicable technical and metrological requirements.                                                                          |
| Ruleset         | Versioned collection of deterministic rules used for applicability and calculation.                                                                             |
| Report snapshot | Immutable record of approved data used to generate an issued report.                                                                                            |
| Audit trail     | Chronological record of material user/system actions and changes.                                                                                               |

---

# 32. References

| # | Source                                                                                                            | URL                                                                                                                               | Use in SRS                                             |
| - | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1 | OIML R 76-1:2006,*Non-automatic weighing instruments - Part 1: Metrological and technical requirements - Tests* | https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf                                                                                | Primary technical requirements/test reference          |
| 2 | OIML R 76-2:2007,*Non-automatic weighing instruments - Part 2: Test report format*                              | https://www.oiml.org/en/files/pdf_r/r076-2-e07.pdf                                                                                | Type-evaluation report format reference                |
| 3 | OIML TC9/SC1: Non-automatic weighing instruments; R 76:2006 and revision projects                                 | https://www.oiml.org/en/tc-sc-pg/tc-sc/scinfo_view?idsc=20                                                                        | Current standards/revision context                     |
| 4 | Department of Consumer Affairs, Legal Metrology overview                                                          | https://consumeraffairs.gov.in/pages/legal-metrology-overview                                                                     | Indian regulatory context                              |
| 5 | Department of Consumer Affairs, FAQs on Legal Metrology / model approval                                          | https://consumeraffairs.gov.in/public/upload/admin/cmsfiles/whatsnews/Frequently_Asked_Questions_on_Legal_Metrology_whatsnews.pdf | Model-approval context and weighing-machine references |
| 6 | SIH 2026 Problem Statement 26035, as supplied in the project brief                                                | https://consumeraffairs.gov.in/pages/legal-metrology-act                                                                          | Problem statement / dataset context supplied by team   |

> **Reference note:** The implementation team should always use the current official publication and applicable Indian legal instruments when validating production rules.

---

# Appendix A - Recommended Implementation Backlog

| Sprint   | Deliverables                                                                    |
| -------- | ------------------------------------------------------------------------------- |
| Sprint 1 | Project setup, auth, RBAC, database schema, UI shell, case state machine        |
| Sprint 2 | Manufacturer/model/instrument master + case wizard                              |
| Sprint 3 | Dynamic test definitions + validation engine                                    |
| Sprint 4 | Rules engine + calculation traces + prototype tests                             |
| Sprint 5 | Evidence + review/approval + audit log                                          |
| Sprint 6 | Report generation + repository/history + dashboard                              |
| Sprint 7 | AI assistant + optional offline mode + security hardening                       |
| Sprint 8 | E2E testing, known-vector verification, demo data, deployment, pitch refinement |

---

# Appendix B - Definition of Done for a Rule

A rule is considered complete only when:

- [ ] Rule has official source/reference recorded.
- [ ] Applicability conditions are documented.
- [ ] Inputs and units are defined.
- [ ] Calculation/logic is independently reviewed.
- [ ] Boundary and negative cases exist.
- [ ] Automated unit/regression tests pass.
- [ ] Output includes rule release and trace.
- [ ] UI explanation is consistent with engine output.
- [ ] Report mapping is verified.
- [ ] Domain expert approval is recorded before production use.
