# Test-Driven Development (TDD) Plan - Salaf Personal Lending Application

## Table of Contents
1. [Project Overview](#project-overview)
2. [TDD Methodology](#tdd-methodology)
3. [Test Strategy](#test-strategy)
4. [Test Scenarios by Feature](#test-scenarios-by-feature)
5. [Success & Failure Test Cases](#success--failure-test-cases)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Integration Testing](#integration-testing)
9. [User Acceptance Testing](#user-acceptance-testing)
10. [Test Data Management](#test-data-management)
11. [Recommended Diagrams](#recommended-diagrams)
12. [Test Automation Strategy](#test-automation-strategy)
13. [Continuous Integration](#continuous-integration)
14. [Test Metrics & Reporting](#test-metrics--reporting)
15. [Risk Assessment](#risk-assessment)

---

## Project Overview

**Application**: Salaf - Personal Lending & Borrowing Management System  
**Architecture**: React Native (Mobile) + Spring Boot (Backend) + SQLite Database  
**Authentication**: JWT-based security  
**Key Features**: User management, Contact management, Lending workflow, Dashboard analytics, PDF receipts, Settings management

---

## TDD Methodology

### Red-Green-Refactor Cycle
1. **Red**: Write failing tests first
2. **Green**: Write minimal code to pass tests
3. **Refactor**: Improve code while keeping tests green

### Test Pyramid Structure
```
    /\
   /  \    E2E Tests (10%)
  /____\   
 /      \   Integration Tests (20%)
/__________\ Unit Tests (70%)
```

---

## Test Strategy

### Testing Levels
- **Unit Tests**: Individual components, services, controllers
- **Integration Tests**: API endpoints, database operations
- **System Tests**: End-to-end user workflows
- **Acceptance Tests**: Business requirement validation

### Testing Types
- **Functional Testing**: Feature behavior validation
- **Non-Functional Testing**: Performance, security, usability
- **Regression Testing**: Ensure existing functionality remains intact
- **Compatibility Testing**: Cross-platform mobile testing

---

## Test Scenarios by Feature

### 1. Authentication & Authorization

#### Unit Tests
- **AuthService.register()**
  - ✅ Valid registration with unique email
  - ❌ Registration with existing email
  - ❌ Registration with invalid email format
  - ❌ Registration with weak password
  - ❌ Registration with missing required fields

- **AuthService.login()**
  - ✅ Valid credentials login
  - ❌ Invalid email/password combination
  - ❌ Login with non-existent user
  - ❌ Login with empty credentials

- **JWT Token Management**
  - ✅ Token generation with valid user
  - ✅ Token validation with valid token
  - ❌ Token validation with expired token
  - ❌ Token validation with malformed token

#### Integration Tests
- **POST /api/auth/register**
  - ✅ Returns 200 with valid user data
  - ❌ Returns 400 with duplicate email
  - ❌ Returns 400 with validation errors

- **POST /api/auth/login**
  - ✅ Returns 200 with JWT token
  - ❌ Returns 401 with invalid credentials
  - ❌ Returns 403 for blocked accounts

### 2. Contact Management

#### Unit Tests
- **ContactService.createContact()**
  - ✅ Create contact with valid email
  - ✅ Create contact linking to existing user
  - ❌ Create contact with invalid email
  - ❌ Create duplicate contact for same user

#### Integration Tests
- **POST /api/contacts**
  - ✅ Creates contact successfully
  - ❌ Returns 400 for invalid data
  - ❌ Returns 401 for unauthorized access

### 3. Lending Workflow

#### Unit Tests
- **LendRequestService.createLend()**
  - ✅ Create lend with valid data
  - ❌ Create lend with negative amount
  - ❌ Create lend with past due date
  - ❌ Create lend for non-existent contact

- **LendRequestService.acceptLend()**
  - ✅ Accept pending lend request
  - ❌ Accept already accepted lend
  - ❌ Accept lend by non-borrower
  - ❌ Accept rejected lend

#### Integration Tests
- **Lend Creation Flow**
  - ✅ POST /api/lends → Status: PENDING
  - ✅ PATCH /api/lends/{id}/accept → Status: ACCEPTED
  - ❌ Accept non-existent lend → 404
  - ❌ Accept without authorization → 403

### 4. Settings Management

#### Unit Tests
- **AuthService.changePassword()**
  - ✅ Change password with correct current password
  - ❌ Change password with incorrect current password
  - ❌ Change password with weak new password
  - ❌ Change password for non-existent user

- **AuthService.deleteAccount()**
  - ✅ Delete account with no active lends
  - ❌ Delete account with active lends
  - ❌ Delete account with pending requests

#### Integration Tests
- **PUT /api/auth/change-password**
  - ✅ Returns 200 with success message
  - ❌ Returns 400 with validation errors
  - ❌ Returns 401 with incorrect current password

### 5. PDF Receipt Generation

#### Unit Tests
- **PdfService.generateReceiptPdf()**
  - ✅ Generate PDF for valid lend
  - ✅ Generate PDF for both lender and borrower
  - ❌ Generate PDF for non-existent lend
  - ❌ Generate PDF without authorization

#### Integration Tests
- **GET /api/pdf/receipt/{id}**
  - ✅ Returns PDF file with correct headers
  - ❌ Returns 404 for non-existent lend
  - ❌ Returns 403 for unauthorized access

---

## Success & Failure Test Cases

### 📊 Successful Test Scenarios

#### 1. Complete Lending Workflow Success
```
Scenario: End-to-End Lending Process
Given: Yousif (lender) and Ali (borrower) are registered users
When: 
  1. Yousif creates lend request for Ali (BD 100)
  2. Ali accepts the lend request
  3. Yousif records partial repayment (BD 50)
  4. Yousif records final repayment (BD 50)
Then: 
  - Lend status progresses: PENDING → ACCEPTED → PARTIALLY_PAID → PAID
  - Remaining balance updates correctly: 100 → 100 → 50 → 0
  - PDF receipt generates successfully
  - Dashboard analytics update correctly
```

#### 2. Settings Management Success
```
Scenario: User Settings Update
Given: User is logged in with valid credentials
When: User changes password from "123456" to "newpass123"
Then: 
  - Password change succeeds
  - User can login with new password
  - Old password no longer works
```

#### 3. PDF Generation Success
```
Scenario: Receipt Download
Given: Completed lend transaction exists
When: User requests PDF receipt
Then: 
  - PDF generates with correct data
  - File downloads successfully
  - Receipt contains all transaction details
```

### ❌ Failure Test Scenarios

#### 1. Authentication Failures
```
Scenario: Login Error 403 - Account Blocked
Given: User account is temporarily blocked
When: User attempts to login with correct credentials
Then: 
  - Returns HTTP 403 Forbidden
  - Error message: "Account temporarily blocked"
  - User cannot access protected resources
```

#### 2. Inaccurate Lend Tracking
```
Scenario: Data Inconsistency in Lend Tracking
Given: Lend with amount BD 100 and 2 repayments of BD 30 each
When: System calculates remaining balance
Then: 
  - Expected: BD 40 remaining
  - Actual Bug: BD 35 remaining (calculation error)
  - Impact: Financial discrepancy in records
```

#### 3. PDF Download Failures
```
Scenario: PDF Generation Timeout
Given: Large lend with extensive repayment history
When: User requests PDF receipt
Then: 
  - Request times out after 30 seconds
  - Returns HTTP 504 Gateway Timeout
  - User receives error: "PDF generation failed"
```

#### 4. Contact Management Failures
```
Scenario: Duplicate Contact Creation
Given: User already has contact "Ali Hassan"
When: User tries to add same contact again
Then: 
  - Returns HTTP 400 Bad Request
  - Error: "Contact already exists"
  - No duplicate contact created
```

#### 5. Settings Validation Failures
```
Scenario: Account Deletion with Active Lends
Given: User has 2 active lends (1 as lender, 1 as borrower)
When: User attempts to delete account
Then: 
  - Returns HTTP 400 Bad Request
  - Error: "Cannot delete account with active lends"
  - Account remains active
```

---

## Performance Testing

### Load Testing Scenarios
- **Concurrent Users**: 100 simultaneous users
- **API Response Time**: < 500ms for 95% of requests
- **Database Queries**: < 100ms average response time
- **PDF Generation**: < 5 seconds for standard receipts

### Stress Testing
- **Peak Load**: 500 concurrent users
- **Memory Usage**: < 512MB for backend service
- **Database Connections**: Max 50 concurrent connections

---

## Security Testing

### Authentication Security
- **JWT Token Expiry**: Tokens expire after 24 hours
- **Password Encryption**: BCrypt with salt rounds
- **SQL Injection**: Parameterized queries protection
- **XSS Protection**: Input sanitization

### Authorization Testing
- **Role-based Access**: Users can only access their own data
- **API Endpoint Security**: All endpoints require valid JWT
- **Data Privacy**: Sensitive data encrypted at rest

---

## Integration Testing

### API Integration Tests
```javascript
// Example Test Structure
describe('Lend Management API', () => {
  test('POST /api/lends - Create lend successfully', async () => {
    const response = await request(app)
      .post('/api/lends')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validLendData);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('PENDING');
  });
});
```

### Database Integration
- **Transaction Integrity**: ACID compliance testing
- **Data Consistency**: Foreign key constraint validation
- **Backup & Recovery**: Data persistence testing

---

## User Acceptance Testing

### Business Scenario Testing
1. **Lender Journey**: Create → Track → Receive Payment
2. **Borrower Journey**: Receive Request → Accept → Make Payments
3. **Settings Management**: Profile → Security → Account Management

### Usability Testing
- **Mobile Responsiveness**: iOS and Android compatibility
- **Navigation Flow**: Intuitive user interface
- **Error Handling**: User-friendly error messages

---

## Test Data Management

### Test Users
```json
{
  "lender": {
    "name": "Yousif",
    "email": "yousif@test.com",
    "password": "123456",
    "phone": "+973 3300 0000"
  },
  "borrower": {
    "name": "Ali Hassan", 
    "email": "ali@test.com",
    "password": "123456",
    "phone": "+973 3300 1111"
  }
}
```

### Test Scenarios Data
- **Valid Lend**: Amount: BD 100, Due: Future date
- **Invalid Lend**: Amount: -50, Due: Past date
- **Repayment**: Partial: BD 50, Full: BD 100

---

## Recommended Diagrams

### 1. System Architecture Diagram
```
[Mobile App] ←→ [API Gateway] ←→ [Spring Boot Backend] ←→ [SQLite DB]
     ↓                                    ↓
[JWT Auth]                        [PDF Generation Service]
```

### 2. Test Pyramid Diagram
Visual representation of testing levels and their proportions

### 3. User Journey Flow Diagrams
- **Lender Flow**: Registration → Add Contact → Create Lend → Track Payments
- **Borrower Flow**: Registration → Receive Request → Accept → Make Payments

### 4. API Endpoint Testing Matrix
| Endpoint | Method | Auth Required | Test Cases | Status |
|----------|--------|---------------|------------|--------|
| /api/auth/login | POST | No | 5 | ✅ |
| /api/lends | POST | Yes | 8 | ✅ |
| /api/pdf/receipt/{id} | GET | Yes | 6 | ✅ |

### 5. Database Schema Testing Diagram
Entity relationships and constraint validation points

### 6. Security Testing Flow
Authentication → Authorization → Data Access → Response

### 7. Performance Testing Results Chart
Response time trends under different load conditions

### 8. Error Handling Decision Tree
Visual flowchart for error scenarios and responses

---

## Test Automation Strategy

### Unit Test Framework
- **Backend**: JUnit 5 + Mockito (Java)
- **Frontend**: Jest + React Native Testing Library

### Integration Test Tools
- **API Testing**: RestAssured (Java) / Supertest (Node.js)
- **Database Testing**: TestContainers for isolated DB tests

### E2E Testing
- **Mobile**: Detox for React Native
- **API**: Postman/Newman for automated API testing

### Test Coverage Goals
- **Unit Tests**: 80% code coverage minimum
- **Integration Tests**: 90% API endpoint coverage
- **E2E Tests**: 100% critical user journey coverage

---

## Continuous Integration

### CI/CD Pipeline
```yaml
# Example GitHub Actions Workflow
name: Salaf CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Java
        uses: actions/setup-java@v2
        with:
          java-version: '20'
      - name: Run Backend Tests
        run: mvn test
      - name: Run Mobile Tests  
        run: npm test
      - name: Generate Coverage Report
        run: mvn jacoco:report
```

### Quality Gates
- **Code Coverage**: Minimum 80%
- **Test Pass Rate**: 100% for critical paths
- **Performance**: API response time < 500ms
- **Security**: No high/critical vulnerabilities

---

## Test Metrics & Reporting

### Key Metrics
- **Test Coverage**: Line, branch, and method coverage
- **Test Execution Time**: Total time for test suite
- **Defect Density**: Bugs per feature/module
- **Test Pass Rate**: Percentage of passing tests

### Reporting Tools
- **Coverage Reports**: JaCoCo for Java, Istanbul for JavaScript
- **Test Results**: JUnit XML reports
- **Performance Metrics**: JMeter reports
- **Security Scans**: OWASP dependency check

---

## Risk Assessment

### High-Risk Areas
1. **Authentication System**: Critical for security
2. **Financial Calculations**: Accuracy essential for trust
3. **Data Privacy**: User information protection
4. **PDF Generation**: Performance and reliability

### Mitigation Strategies
- **Comprehensive Test Coverage**: Focus on critical paths
- **Security Testing**: Regular vulnerability assessments
- **Performance Monitoring**: Continuous performance testing
- **Data Validation**: Input sanitization and validation

---

## Additional Testing Considerations

### Mobile-Specific Testing
- **Device Compatibility**: iOS/Android versions
- **Network Conditions**: Offline/poor connectivity
- **Battery Usage**: Performance impact testing
- **Storage Management**: Local data handling

### Accessibility Testing
- **Screen Reader Compatibility**: VoiceOver/TalkBack
- **Color Contrast**: WCAG compliance
- **Touch Target Size**: Minimum 44px touch targets
- **Keyboard Navigation**: Alternative input methods

### Localization Testing
- **Multi-language Support**: Arabic/English
- **Currency Formatting**: BD (Bahraini Dinar)
- **Date/Time Formats**: Regional preferences
- **RTL Layout**: Right-to-left text support

---

## Test Environment Setup

### Development Environment
- **Local Database**: SQLite for development
- **Mock Services**: Wiremock for external dependencies
- **Test Data**: Seeded test users and scenarios

### Staging Environment
- **Production-like Setup**: Mirrored configuration
- **Integration Testing**: Full system testing
- **Performance Testing**: Load testing environment

### Production Monitoring
- **Health Checks**: API endpoint monitoring
- **Error Tracking**: Sentry for error reporting
- **Performance Monitoring**: Application metrics
- **User Analytics**: Usage pattern tracking

---

## Conclusion

This TDD plan provides a comprehensive testing strategy for the Salaf application, covering all critical aspects from unit tests to user acceptance testing. The focus on both successful and failure scenarios ensures robust application behavior under various conditions.

### Next Steps
1. Implement unit tests for core business logic
2. Set up integration testing framework
3. Create automated test suites
4. Establish CI/CD pipeline with quality gates
5. Implement monitoring and alerting systems

### Success Criteria
- 80%+ test coverage across all modules
- 100% critical path test coverage
- Sub-500ms API response times
- Zero high-severity security vulnerabilities
- Successful hackathon demonstration

---

*This document should be updated regularly as new features are added and test scenarios evolve.*