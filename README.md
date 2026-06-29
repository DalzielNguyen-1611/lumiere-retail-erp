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

## 🚀 Product Roadmap & Future Enhancements
While the current MVP successfully digitalizes the core operational flow, the following modules are planned for future phases to fully address the specific business needs and pain points of the beauty retail industry:

*   **Promotions & Loyalty Management:** Implementation of membership tiers, reward points tracking, and dynamic pricing strategies (e.g., vouchers, flash sales) seamlessly integrated with the POS to boost customer retention.
*   **Services & Booking System:** Extending the studio's capabilities to manage beauty service appointments, resource allocation (rooms, beds), and automated commission calculations for service staff.
*   **Vendor Relationship Management (VRM):** Enhancing the current Procurement module to include supplier performance KPI evaluation (e.g., on-time delivery), contract management, and price catalog comparisons.

## 📂 BA Artifacts & Deliverables
Below are the key business analysis documents and diagrams created for this system:

*   🔗 [Business Process Models (BPMN)](#) *(Insert link to your BPMN diagrams)*
*   🔗 [Entity-Relationship Diagram (ERD)](https://www.drawdb.app/editor?shareId=62c72d12ef53d4ceea7ea792266d76a7)
*   🔗 [User Stories & Acceptance Criteria](#) *(Insert link to your backlog/requirements sheet)*
*   🔗 [UI/UX Wireframes (Figma)](https://www.figma.com/make/EqduAoFREHtni0QZgQeYtF/Cosmetic-Store-Dashboard-Design?t=F2uYpJKs1YRvWfOq-1&preview-route=%2Flogin)

---
*Note: The source code (`backend`, `frontend`, `database`) is included in this repository to demonstrate the practical technical implementation of the defined business requirements.*