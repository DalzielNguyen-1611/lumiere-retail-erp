# Lumière Beauty Studio - Retail ERP & POS System

## 📖 Executive Summary
Lumière is a comprehensive Retail ERP and Point-of-Sale (POS) system designed to digitalize and streamline the operations of a beauty studio. This project focuses on aligning complex business workflows with system logic to ensure seamless data synchronization across multiple departments.

## 🎯 Project Scope
The MVP (Minimum Viable Product) covers 10+ core enterprise modules, including:
*   **Point of Sale (POS):** Transaction processing and customer management.
*   **Inventory Management:** Real-time stock tracking and procurement.
*   **Human Resources (HR):** Employee data and shift management.
*   **Finance & Accounting:** Revenue tracking and automated reporting.

## 💼 Business Analysis Highlights
In this project, I acted as the bridge between business requirements and technical implementation, focusing on:
*   **Process Modeling:** Designed end-to-end workflows (AS-IS & TO-BE) using **BPMN** to map out retail operations clearly.
*   **System Logic & Data Mapping:** Defined strict cross-module business rules. For example, established the logic that a completed sales transaction at the POS must simultaneously be processed as a stock output in the Inventory module to maintain real-time data integrity.
*   **Database Design:** Constructed a robust relational database schema (ERD) optimized for complex ERP queries and automated PL/SQL triggers.

## 🛠️ Tools & Technologies
*   **Business Analysis & Design:** Figma (UI/UX), BPMN 2.0 (Process Modeling).
*   **Database & Logic:** Oracle 21c, PL/SQL, SQL.
*   **Development (MVP):** ReactJS, Node.js.

## 💡 Key Challenge & Solution
*   **Challenge:** Ensuring that inventory levels accurately reflect sales across multiple store branches in real-time without causing data inconsistencies.
*   **Solution:** Analyzed and mapped a unified workflow where a POS checkout immediately triggers a synchronized backend event, treating the "Sales" action structurally identical to a "Stock Output" action in the ERP system.

## 📂 BA Artifacts & Deliverables
Below are the key business analysis documents and diagrams created for this system:

*   [🔗 Business Process Models (BPMN)](#) *(Insert link to your BPMN diagrams)*
*   [🔗 Entity-Relationship Diagram (ERD)](#) *(Insert link to your database schema/ERD)*
*   [🔗 User Stories & Acceptance Criteria](#) *(Insert link to your backlog/requirements sheet)*
*   [🔗 UI/UX Wireframes (Figma)](#) *(Insert link to Figma mockups)*

---
*Note: The source code (`backend`, `frontend`, `database`) is included in this repository to demonstrate the practical technical implementation of the defined business requirements.*