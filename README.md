# Depression Screener (PHQ-9 FHIR R4 Demo)

A browser-based proof-of-concept that implements the PHQ-9 (Patient Health Questionnaire-9) depression screening tool using the FHIR R4 standard. Responses are transformed into proper FHIR resources — Questionnaire, Patient, QuestionnaireResponse, RiskAssessment, and Observation — and persisted locally in IndexedDB. A built-in database explorer lets you browse, inspect, and download the stored resources as a FHIR Bundle.
