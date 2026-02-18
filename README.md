# TrackMe Education

## What is TrackMe Education? 

## How to run locally
This repository uses Docker to run the application locally.

### Prerequisites
- Docker
- Docker Compose

### Steps
1. Clone the repository
2. Run `docker compose up`
3. Access the application at `http://localhost:5173`

## Database model
While TrackMe Education runs on a DynamoDB database in production. The database model below should help you understand the relationships between the different tables.

```mermaid
erDiagram
	tenants ||--o{ users : references
	courses }o--|| tenants : references
	courses ||--o{ course_user : references
	users ||--o{ course_user : references
	course_user }o--|| tenants : references

	tenants {
		UUID id
		TEXT name
		TEXT slug
		TEXT status
		JSON owner_email_addresses
		JSON billing_email_addresses
		ENUM plan_tier
		ENUM subscription_status
		DATE subscription_ends
		TEXT deployment_type
		TEXT database_identifier
		JSON settings
		DATETIME created_at
		DATETIME updated_at
		DATETIME disabled_at
	}

	users {
		UUID tenant_id
		UUID id
	}

	courses {
		UUID tenant_id
		UUID id
	}

	course_user {
		UUID tenant_id
		UUID id
		UUID user_id
		UUID course_id
	}
``` 
