# Business Bank Account Onboarding Flow - Bank of America

## Overview

This document specifies the complete onboarding flow for a US business bank account opening demo. The flow demonstrates AI-enabled document extraction and dynamic screens based on user inputs, using LEI lookup for business verification.

---

## Screen Inventory

| Screen ID | Screen Name | Condition to Display |
|-----------|-------------|---------------------|
| 1.1 | Email Input | Start |
| 1.2 | Email OTP Verification | After 1.1 |
| 1.3 | Phone Input | After 1.2 |
| 1.4 | Phone OTP Verification | After 1.3 |
| 1.6 | Government ID Upload | After 1.4 |
| 1.7 | Government ID Extraction Confirmation | After 1.6 |
| 2.1 | LEI Input | After 1.7 |
| 2.2 | LEI Lookup Confirmation | After 2.1 |
| 2.3 | Restricted Industries Modal | After 2.2 |
| 3.1 | DBA Certificate Upload | If entity_type = "Sole Proprietorship" |
| 3.2 | DBA Extraction Confirmation | After 3.1 |
| 3.3 | Articles of Organization Upload | If entity_type = "LLC" |
| 3.4 | Articles of Organization Extraction Confirmation | After 3.3 |
| 3.5 | Operating Agreement Upload | If entity_type = "LLC" |
| 3.6 | Operating Agreement Extraction Confirmation | After 3.5 |
| 3.7 | Partnership Agreement Upload | If entity_type IN ["General Partnership", "Limited Partnership", "LLP"] |
| 3.8 | Partnership Agreement Extraction Confirmation | After 3.7 |
| 3.9 | Articles of Incorporation Upload | If entity_type IN ["Corporation", "S-Corporation"] |
| 3.10 | Articles of Incorporation Extraction Confirmation | After 3.9 |
| 3.11 | Bylaws / Stock Ledger Upload | If entity_type IN ["Corporation", "S-Corporation"] |
| 3.12 | Shareholder Extraction Confirmation | After 3.11 |
| 4.1 | Authorization Summary - Owner/Member/Shareholder | If verified_name matches owner/member/shareholder |
| 4.2 | Authorization Summary - Non-Owner | If verified_name does not match any owner |
| 4.3 | POA Upload | If requiresPOA = true |
| 4.4 | POA Extraction Confirmation | After 4.3 |
| 4.5 | Corporate/LLC/Partnership Resolution Upload | If requiresResolution = true |
| 4.6 | Proof of Address Upload | After authorization documents |
| 5.1 | Online Presence Question | After 4.6 |
| 5.2 | Website URL Input | If online_presence = yes |
| 5.3 | International Operations Question | After 5.1 or 5.2 |
| 5.4 | Operating Countries Selection | If international_ops = yes |
| 5.5 | Physical Presence Abroad Question | After 5.4 |
| 5.6 | Physical Address Question | After 5.3 or 5.5 |
| 5.7 | Business Address Input | If physical_address = yes |
| 6.1 | Annual Revenue | After 5.6 or 5.7 |
| 6.2 | Sources of Funds | After 6.1 |
| 6.3 | Monthly Deposits | After 6.2 |
| 6.4 | Monthly Withdrawals | After 6.3 |
| 6.5 | Cash Deposit Percentage | After 6.4 |
| 6.6 | Cash Withdrawal Percentage | After 6.5 |
| 6.7 | Product Recommendations | After 6.6 |
| 6.8 | Plan Recommendation | After 6.7 |
| 7.1 | Review Pane | After 6.8 |
| 7.2 | Declaration | After 7.1 |
| 7.3 | Success | After 7.2 |

---

## Step 1: Identity Verification

### Screen 1.1: Email Input

**Question:** "What is your email address?"
**Input:** Email field
**Next:** → 1.2

### Screen 1.2: Email OTP Verification

**Display:** "We've sent a 6-digit code to [email]. Please enter it below."
**Input:** 6-digit OTP field
**Next:** → 1.3

### Screen 1.3: Phone Input

**Question:** "What is your mobile number?"
**Input:** Phone field with +1 prefix
**Next:** → 1.4

### Screen 1.4: Phone OTP Verification

**Display:** "We've sent a 6-digit code to [phone]. Please enter it below."
**Input:** 6-digit OTP field
**Next:** → 1.4A

### Screen 1.4A: Full Name Input

**Question:** "What is your full legal name?"
**Input:** Text field
**Next:** → 1.6

### Screen 1.6: Government ID Upload

**Question:** "Please upload a government-issued ID"
**Input:** File upload (drag & drop or browse)
**Accepted documents:**
- US Driver's License
- US Passport
- State ID Card

**Accepted formats:** PDF, JPG, PNG
**Next:** → 1.7

### Screen 1.7: Government ID Extraction Confirmation

**Display:** "We extracted the following from your ID. Please confirm:"

| Field | Extracted Value |
|-------|-----------------|
| Full Name | [extracted] |
| Document Type | [extracted] |
| Document Number | [extracted] |
| Date of Birth | [extracted] |
| Address | [extracted] |
| Expiry Date | [extracted] |
| State Issued | [extracted] |

**Input:** Editable fields + Confirm button
**Next:** → 2.1

---

## Step 2: Business Verification

### Screen 2.1: LEI Input

**Question:** "Enter your Legal Entity Identifier (LEI)"
**Helper text:** "A 20-character alphanumeric code that identifies your business. You can find your LEI at gleif.org"
**Input:** Text field (20 characters, format: XXXX00000000XXXXXXXXXX)
**Validation:** Real-time format validation
**Action:** "Look Up Business" button
**Next:** → 2.2

### Screen 2.2: LEI Lookup Confirmation

**Display:** "We found the following business. Please confirm:"

| Field | Value from GLEIF |
|-------|------------------|
| Legal Name | [from API] |
| Entity Type | [from API] |
| Jurisdiction | [from API] |
| Registered Address | [from API] |
| Headquarters Address | [from API] |
| Formation Date | [from API] |
| Status | [from API] |
| LEI Status | [from API] |

**Input:** Confirm button (non-editable since from official source)
**Store:** `entity_type` for branching logic
**Next:** → 2.3

### Screen 2.3: Restricted Industries Modal

**Type:** Modal overlay
**Title:** "Before we continue..."
**Content:**
"We're unable to open accounts for businesses in the following industries:

- Money Services Businesses (MSBs)
- Cryptocurrency and virtual assets
- Cannabis and CBD (even where state-legal)
- Gambling and gaming
- Adult entertainment
- Weapons and firearms dealers
- Shell companies with no operations
- Foreign shell banks"

**Input:** Checkbox: "I confirm my business is not in any of these industries"
**Actions:** "Continue" button
**Next:** Based on entity_type from Screen 2.2:
- If entity_type = "Sole Proprietorship" → 3.1
- If entity_type = "LLC" → 3.3
- If entity_type IN ["General Partnership", "Limited Partnership", "LLP"] → 3.7
- If entity_type IN ["Corporation", "S-Corporation"] → 3.9

---

## Step 3: Document Upload & Verification

### Sole Proprietorship Path

#### Screen 3.1: DBA Certificate Upload

**Condition:** entity_type = "Sole Proprietorship"
**Question:** "Please upload your DBA (Doing Business As) Certificate"
**Helper text:** "Also known as a Fictitious Business Name certificate. If you operate under your legal name, you may skip this."
**Input:** File upload OR "I operate under my legal name" checkbox
**Next:** → 3.2 (if uploaded) OR → 4.1 (if skipped)

#### Screen 3.2: DBA Extraction Confirmation

**Display:** "We extracted the following from your DBA Certificate:"

| Field | Extracted Value |
|-------|-----------------|
| Business Name (DBA) | [extracted] |
| Owner Name | [extracted] |
| Filing Date | [extracted] |
| County/State Filed | [extracted] |
| Expiry Date | [extracted] |

**Input:** Editable fields + Confirm button
**Next:** → 4.1

---

### LLC Path

#### Screen 3.3: Articles of Organization Upload

**Condition:** entity_type = "LLC"
**Question:** "Please upload your Articles of Organization"
**Helper text:** "This is the document filed with the state to form your LLC."
**Input:** File upload
**Next:** → 3.4

#### Screen 3.4: Articles of Organization Extraction Confirmation

**Display:** "We extracted the following from your Articles of Organization:"

| Field | Extracted Value |
|-------|-----------------|
| LLC Name | [extracted] |
| State of Formation | [extracted] |
| Formation Date | [extracted] |
| Registered Agent | [extracted] |
| Registered Agent Address | [extracted] |
| Management Type | [extracted: Member-Managed / Manager-Managed] |

**Input:** Editable fields + Confirm button
**Next:** → 3.5

#### Screen 3.5: Operating Agreement Upload

**Condition:** entity_type = "LLC"
**Question:** "Please upload your Operating Agreement"
**Helper text:** "This document outlines ownership percentages and member rights."
**Input:** File upload
**Next:** → 3.6

#### Screen 3.6: Operating Agreement Extraction Confirmation

**Display:** "We extracted the following members from your Operating Agreement:"

| Member Name | Ownership % | Role |
|-------------|-------------|------|
| [extracted] | [extracted] | [Member/Manager] |
| [extracted] | [extracted] | [Member/Manager] |

**Additional fields:**
| Field | Extracted Value |
|-------|-----------------|
| Effective Date | [extracted] |
| Tax Classification | [extracted: Partnership / S-Corp / Disregarded] |

**Input:** Editable table + Confirm button

**On Confirm — Name Matching Logic:**
Compare verified_name (from Screen 1.7) against each member name in the table.

- If a match is found:
  - Set matched_member_name = that member's name
  - Set matched_member_ownership = that member's ownership %
  - Set member_count = total members
  - → Go to 4.1
- If no match is found:
  - Set member_count = total members
  - → Go to 4.2

---

### Partnership Path

#### Screen 3.7: Partnership Agreement Upload

**Condition:** entity_type IN ["General Partnership", "Limited Partnership", "LLP"]
**Question:** "Please upload your Partnership Agreement"
**Helper text:** "This document establishes the partnership and defines partner roles."
**Input:** File upload
**Next:** → 3.8

#### Screen 3.8: Partnership Agreement Extraction Confirmation

**Display:** "We extracted the following partners from your Partnership Agreement:"

| Partner Name | Ownership % | Type |
|--------------|-------------|------|
| [extracted] | [extracted] | [General Partner / Limited Partner] |
| [extracted] | [extracted] | [General Partner / Limited Partner] |

**Additional fields:**
| Field | Extracted Value |
|-------|-----------------|
| Partnership Name | [extracted] |
| Formation Date | [extracted] |
| State of Formation | [extracted] |
| Term | [extracted: Perpetual / Fixed] |

**Input:** Editable table + Confirm button

**On Confirm — Name Matching Logic:**
Compare verified_name (from Screen 1.7) against each partner name in the table.

- If a match is found:
  - Set matched_partner_name = that partner's name
  - Set matched_partner_ownership = that partner's ownership %
  - Set matched_partner_type = General Partner / Limited Partner
  - Set partner_count = total partners
  - → Go to 4.1
- If no match is found:
  - Set partner_count = total partners
  - → Go to 4.2

---

### Corporation Path

#### Screen 3.9: Articles of Incorporation Upload

**Condition:** entity_type IN ["Corporation", "S-Corporation"]
**Question:** "Please upload your Articles of Incorporation"
**Helper text:** "Also known as a Certificate of Incorporation or Corporate Charter."
**Input:** File upload
**Next:** → 3.10

#### Screen 3.10: Articles of Incorporation Extraction Confirmation

**Display:** "We extracted the following from your Articles of Incorporation:"

| Field | Extracted Value |
|-------|-----------------|
| Corporation Name | [extracted] |
| State of Incorporation | [extracted] |
| Incorporation Date | [extracted] |
| Registered Agent | [extracted] |
| Authorized Shares | [extracted] |
| Par Value | [extracted] |
| Corporate Purpose | [extracted] |

**Input:** Editable fields + Confirm button
**Next:** → 3.11

#### Screen 3.11: Bylaws / Stock Ledger Upload

**Condition:** entity_type IN ["Corporation", "S-Corporation"]
**Question:** "Please upload your Corporate Bylaws or Stock Ledger"
**Helper text:** "We need to verify shareholders and officers of the corporation."
**Input:** File upload
**Next:** → 3.12

#### Screen 3.12: Shareholder Extraction Confirmation

**Display:** "We extracted the following shareholders and officers:"

**Shareholders:**
| Name | Shares | Ownership % |
|------|--------|-------------|
| [extracted] | [extracted] | [extracted] |
| [extracted] | [extracted] | [extracted] |

**Officers:**
| Name | Title |
|------|-------|
| [extracted] | [CEO / President] |
| [extracted] | [Secretary] |
| [extracted] | [Treasurer / CFO] |

**Input:** Editable tables + Confirm button

**On Confirm — Name Matching Logic:**
Compare verified_name (from Screen 1.7) against each shareholder name AND officer name.

- If a match is found in shareholders:
  - Set matched_shareholder_name = that shareholder's name
  - Set matched_shareholder_ownership = that shareholder's ownership %
  - Set shareholder_count = total shareholders
  - → Go to 4.1
- If a match is found in officers only (not shareholder):
  - Set matched_officer_name = that officer's name
  - Set matched_officer_title = that officer's title
  - Set shareholder_count = total shareholders
  - Set is_officer_only = true
  - → Go to 4.1 (with officer-specific messaging)
- If no match is found:
  - Set shareholder_count = total shareholders
  - → Go to 4.2

---

## Step 4: Authorization

### Screen 4.1: Authorization Summary - Owner/Member/Shareholder

**Condition:** verified_name matches owner, member, partner, shareholder, or officer

**Display (Dynamic - build from previous inputs):**

Opening line:

```
You are [verified_name from Screen 1.7], [role] at [company_name from LEI lookup], which is a [entity_type from Screen 2.2] formed in [jurisdiction].
```

Where [role] is determined by:
- If entity_type = "Sole Proprietorship" → "the owner"
- If entity_type = "LLC" → "a member with [matched_member_ownership]% ownership"
- If entity_type IN ["General Partnership", "Limited Partnership", "LLP"] → "a [matched_partner_type] with [matched_partner_ownership]% ownership"
- If entity_type IN ["Corporation", "S-Corporation"] AND is_shareholder → "a shareholder with [matched_shareholder_ownership]% ownership"
- If entity_type IN ["Corporation", "S-Corporation"] AND is_officer_only → "the [matched_officer_title]"

Then show document requirements with reasons:

**Power of Attorney section:**

```
✓ Power of Attorney: Not required
[If Sole Proprietorship]: You're the owner of this business, so you have full authority to open this account.
[If LLC]: You're listed as a member of this LLC, so you have the authority to open this account.
[If Partnership]: You're listed as a partner, so you have the authority to open this account.
[If Corporation - shareholder]: You're listed as a shareholder, so you have the authority to open this account.
[If Corporation - officer only]: You're listed as an officer, so you have the authority to act on behalf of the corporation.
```

**Corporate/LLC/Partnership Resolution section:**

```
[If entity_type = "Sole Proprietorship"]:
✓ Resolution: Not required
As the sole owner, you have full authority.

[If entity_type = "LLC" AND member_count = 1]:
✓ LLC Resolution: Not required
As the sole member, you have full authority.

[If entity_type = "LLC" AND member_count > 1]:
• LLC Resolution: Required
Since your LLC has multiple members, we need a resolution authorizing this account opening and designating signers.

[If entity_type IN ["General Partnership", "Limited Partnership", "LLP"]]:
• Partnership Resolution: Required
Since your business is a partnership, we need a resolution signed by partners authorizing this account opening.

[If entity_type IN ["Corporation", "S-Corporation"] AND shareholder_count = 1]:
✓ Corporate Resolution: Not required
As the sole shareholder, you have full authority.

[If entity_type IN ["Corporation", "S-Corporation"] AND shareholder_count > 1]:
• Corporate Resolution: Required
Since your corporation has multiple shareholders, we need a board resolution authorizing this account opening and designating authorized signers.
```

**Next:**
- If requiresResolution = true → 4.5
- If requiresResolution = false → 4.6

---

### Screen 4.2: Authorization Summary - Non-Owner

**Condition:** verified_name does not match any owner, member, partner, shareholder, or officer

**Display (Dynamic - build from previous inputs):**

Opening line:

```
You are [verified_name from Screen 1.7], and you're opening an account for [company_name from LEI lookup], which is a [entity_type from Screen 2.2].

We noticed you're not listed as an owner, member, partner, shareholder, or officer of this entity. That's okay — we'll just need some additional documents.
```

**Power of Attorney section:**

```
• Power of Attorney: Required
Since you're not listed as an authorized person, we need a POA signed by [an owner / a member / a general partner / a shareholder or officer] authorizing you to act on behalf of the business.

[List relevant names]:
- [name 1]
- [name 2]
```

**Resolution section:**

```
[If entity_type = "Sole Proprietorship"]:
✓ Resolution: Not required
The business has a single owner.

[If entity_type = "LLC" AND member_count = 1]:
✓ LLC Resolution: Not required
The LLC has a single member.

[If entity_type = "LLC" AND member_count > 1]:
• LLC Resolution: Required
Since this LLC has multiple members, we need a resolution authorizing this account opening.

[If entity_type IN ["General Partnership", "Limited Partnership", "LLP"]]:
• Partnership Resolution: Required
We need a resolution signed by partners authorizing this account opening.

[If entity_type IN ["Corporation", "S-Corporation"] AND shareholder_count = 1]:
✓ Corporate Resolution: Not required
The corporation has a sole shareholder.

[If entity_type IN ["Corporation", "S-Corporation"] AND shareholder_count > 1]:
• Corporate Resolution: Required
We need a board resolution authorizing this account opening.
```

**Next:** → 4.3

### Screen 4.3: POA Upload

**Condition:** requiresPOA = true
**Question:** "Please upload your Power of Attorney"
**Helper text:** "The POA must be signed by an authorized person of the business and must grant you authority to open and operate bank accounts on behalf of the entity."
**Input:** File upload
**Next:** → 4.4

### Screen 4.4: POA Extraction Confirmation

**Display:** "We extracted the following from your POA:"

| Field | Extracted Value |
|-------|-----------------|
| Granted By (Principal) | [extracted] |
| Granted To (Agent) | [extracted] |
| Scope of Authority | [extracted] |
| Date Issued | [extracted] |
| Expiry Date | [extracted] |
| Notarized | [Yes/No] |
| State | [extracted] |

**Input:** Editable fields + Confirm button
**Next:**
- If requiresResolution = true → 4.5
- If requiresResolution = false → 4.6

### Screen 4.5: Corporate/LLC/Partnership Resolution Upload

**Condition:** requiresResolution = true
**Question:** Dynamic based on entity type:
- If LLC: "Please upload your LLC Resolution"
- If Partnership: "Please upload your Partnership Resolution"
- If Corporation: "Please upload your Corporate Board Resolution"

**Helper text:** "This document authorizes the opening of this bank account and designates who can sign on behalf of the entity."
**Input:** File upload
**Next:** → 4.6

### Screen 4.6: Proof of Address Upload

**Question:** "Please upload a Proof of Business Address"
**Helper text:** "Accepted: Utility bill, business bank statement (within 3 months), commercial lease agreement, or property tax statement"
**Input:** File upload
**Next:** → 5.1

---

## Step 5: Business Details

### Screen 5.1: Online Presence Question

**Question:** "Does your business have an online presence?"
**Input:** Yes / No buttons
**Next:**
- If Yes → 5.2
- If No → 5.3

### Screen 5.2: Website URL Input

**Condition:** online_presence = yes
**Question:** "What is your website URL?"
**Input:** URL field
**Next:** → 5.3

### Screen 5.3: International Operations Question

**Question:** "Does your business operate in countries outside the United States?"
**Input:** Yes / No buttons
**Next:**
- If Yes → 5.4
- If No → 5.6

### Screen 5.4: Operating Countries Selection

**Condition:** international_ops = yes
**Question:** "Which countries do you operate in?"
**Input:** Multi-select dropdown with country list
**Next:** → 5.5

### Screen 5.5: Physical Presence Abroad Question

**Condition:** international_ops = yes
**Question:** "Do you have a branch, office, or physical presence in these countries?"
**Input:** Yes / No buttons
**Next:** → 5.6

### Screen 5.6: Physical Business Address Question

**Question:** "Do you have a physical business address (not a P.O. Box or registered agent address)?"
**Input:** Yes / No buttons
**Next:**
- If Yes → 5.7
- If No → 6.1

### Screen 5.7: Business Address Input

**Condition:** physical_address = yes
**Question:** "What is your business address?"
**Input:** Address fields:
- Street Address
- Suite/Unit (optional)
- City
- State (dropdown)
- ZIP Code

**Next:** → 6.1

---

## Step 6: Financial Profile & Products

### Screen 6.1: Annual Revenue

**Question:** "What is your expected annual revenue?"
**Input:** Bracket selection:
- Less than $50,000
- $50,000 - $100,000
- $100,000 - $250,000
- $250,000 - $500,000
- $500,000 - $1 million
- $1 million - $5 million
- $5 million - $10 million
- More than $10 million

**Next:** → 6.2

### Screen 6.2: Sources of Funds

**Question:** "What are your main sources of funds?"
**Input:** Multi-select checkboxes:
- Business Revenue / Sales
- Owner/Member Capital Contributions
- Loans / Lines of Credit
- Investor Funding
- Customer Deposits / Prepayments
- Government Grants or Contracts
- Other (shows text field if selected)

**Next:** → 6.3

### Screen 6.3: Monthly Deposits

**Question:** "What is your expected monthly deposit volume?"
**Input:** Bracket selection:
- Less than $10,000
- $10,000 - $25,000
- $25,000 - $50,000
- $50,000 - $100,000
- $100,000 - $500,000
- More than $500,000

**Next:** → 6.4

### Screen 6.4: Monthly Withdrawals

**Question:** "What is your expected monthly withdrawal volume?"
**Input:** Bracket selection (same options as 6.3)
**Next:** → 6.5

### Screen 6.5: Cash Deposit Percentage

**Question:** "What percentage of your deposits will be in cash?"
**Input:** Percentage slider (0% - 100%)
**Next:** → 6.6

### Screen 6.6: Cash Withdrawal Percentage

**Question:** "What percentage of your withdrawals will be in cash?"
**Input:** Percentage slider (0% - 100%)
**Next:** → 6.7

### Screen 6.7: Product Recommendations

**Question:** "Based on what you've told us, here's what we think you'll need:"

**Display (Dynamic - pre-filled based on previous inputs):**

**Always included:**
```
✓ Business Checking Account
  Your primary operating account for deposits and payments.

✓ Online & Mobile Banking
  Included with all Bank of America business accounts.

✓ Domestic ACH & Wire Transfers
  Send and receive payments within the US.
```

**If international_operations = yes (from Screen 5.3):**
```
✓ International Wire Transfers
  You mentioned operating in [operating_countries from Screen 5.4].

✓ Foreign Exchange Services
  Convert currencies for international transactions.
```

**If owner_count > 1 (members, partners, or shareholders from Step 3):**
```
✓ Multiple User Access
  Your [entity_type] has multiple [members/partners/shareholders], so you'll likely need team access.
```

**If online_presence = yes (from Screen 5.1):**
```
✓ Merchant Services
  Accept credit card payments online through your website.
```

**If physical_address = yes (from Screen 5.6) AND business activities suggest retail:**
```
✓ Point of Sale Solutions
  Accept in-person card payments at your business location.
```

**If entity_type IN ["Corporation", "LLC", "Partnership"] AND annual_revenue > "$250,000 - $500,000" (from Screen 6.1):**
```
✓ Payroll Services
  Process employee payroll efficiently.
```

---

**Then show optional add-ons the user can select:**

"You might also be interested in:"

| Option | Description |
|--------|-------------|
| ○ Business Savings Account | Earn interest on your reserves |
| ○ Business Credit Card | A credit card for company expenses with rewards |
| ○ Business Line of Credit | Flexible financing for cash flow needs |
| ○ Business Loan | Term financing to grow your business |
| ○ Payroll Services | Process payroll (if not already pre-selected) |
| ○ Merchant Services | Accept card payments (if not already pre-selected) |
| ○ Positive Pay | Fraud protection for checks |
| ○ Remote Deposit | Deposit checks from your office |

**Input:** Pre-selected checkboxes (editable) + optional checkboxes
**Action:** "Confirm & Continue" button
**Next:** → 6.8

---

**Product Recommendation Logic Summary:**

| Feature | Auto Pre-select When |
|---------|---------------------|
| Business Checking | Always |
| Online & Mobile Banking | Always |
| Domestic Transfers | Always |
| International Wires | international_operations = yes |
| Foreign Exchange | international_operations = yes |
| Multiple User Access | owner_count > 1 |
| Merchant Services | online_presence = yes |
| Point of Sale | physical_address = yes |
| Payroll Services | entity_type IN [Corp, LLC, Partnership] AND revenue > $250K |

---

### Screen 6.8: Plan Recommendation

**Question:** "Based on your business profile, here's the account we recommend:"

---

**Recommendation Logic (Deterministic - first match wins):**

```
IF payroll_services selected (from Screen 6.7) → Business Advantage 360 Account
ELSE IF owner_count > 1 → Business Advantage 360 Account
ELSE IF entity_type IN ["Corporation", "S-Corporation"] → Business Advantage 360 Account
ELSE IF revenue_index >= 4 (from Screen 6.1, meaning > $500K) → Business Advantage 360 Account
ELSE IF monthly_deposits_index >= 3 (from Screen 6.3, meaning > $50K) → Business Advantage Fundamentals
ELSE → Business Advantage Fundamentals
```

---

**Display:**

**Opening Line (Dynamic):**

```
[If Business Advantage Fundamentals]:
"We recommend the Business Advantage Fundamentals account for your business."

[If Business Advantage 360]:
"We recommend the Business Advantage 360 account for your business."
```

---

**Justification Summary (Dynamic - based on user inputs):**

Display "Here's why:" followed by a summary box containing relevant points:

```
[If entity_type = "Sole Proprietorship"]:
• You're a sole proprietor operating as [business_name]

[If entity_type = "LLC"]:
• You're operating [company_name], an LLC formed in [jurisdiction]

[If entity_type IN ["Corporation", "S-Corporation"]]:
• You're operating [company_name], a corporation incorporated in [jurisdiction]

[If entity_type IN ["General Partnership", "Limited Partnership", "LLP"]]:
• You're operating [company_name], a partnership formed in [jurisdiction]

[If owner_count = 1]:
• You're the sole [owner/member/shareholder]

[If owner_count > 1]:
• Your [entity_type] has [owner_count] [members/partners/shareholders], requiring multi-user access

[If payroll_services selected]:
• You need payroll processing for your team

[If international_operations = yes]:
• You operate internationally in [operating_countries]

[If international_operations = no]:
• Your operations are based entirely in the United States

[If annual_revenue displayed]:
• Your expected annual revenue is [annual_revenue]

[If online_presence = yes]:
• You have an online presence at [website_url]

[If physical_address = yes]:
• You have a physical business location
```

---

**Plan Card Display:**

```
[If Business Advantage Fundamentals recommended]:
┌─────────────────────────────────────────────────────────────────┐
│  Business Advantage Fundamentals        $16.95  PER MONTH      │
│                                    (waivable with $5K balance)  │
├─────────────────────────────────────────────────────────────────┤
│  💼 Best for small businesses and startups                      │
│  ✓ 200 free transactions per month                              │
│  ✓ $7,500 free cash deposits per month                          │
│  ✓ Free Online & Mobile Banking                                 │
│  ✓ Free debit card                                              │
│  ✓ 2 free users                                                 │
│  ✓ Integrates with QuickBooks and accounting software           │
├─────────────────────────────────────────────────────────────────┤
│  [ Start with Business Advantage Fundamentals ]                 │
└─────────────────────────────────────────────────────────────────┘

[If Business Advantage 360 recommended]:
┌─────────────────────────────────────────────────────────────────┐
│  Business Advantage 360                 $29.95  PER MONTH      │
│                                   (waivable with $15K balance)  │
├─────────────────────────────────────────────────────────────────┤
│  🏢 Best for growing and established businesses                 │
│  ✓ 500 free transactions per month                              │
│  ✓ $20,000 free cash deposits per month                         │
│  ✓ Free Online & Mobile Banking                                 │
│  ✓ Free debit card with higher limits                           │
│  ✓ Unlimited users                                              │
│  ✓ Earnings credit on account balance                           │
│  ✓ Discounted wire transfer fees                                │
│  ✓ Dedicated support line                                       │
├─────────────────────────────────────────────────────────────────┤
│  [ Start with Business Advantage 360 ]                          │
└─────────────────────────────────────────────────────────────────┘
```

---

**Alternative Plan Option:**

Below the recommended plan card:

```
"Not quite right? View the other option:"

[Expandable card showing the non-recommended plan with its features]
```

---

**Input:** Select plan button (recommended pre-selected) + option to switch
**Action:** "Continue with [Selected Plan]" button
**Next:** → 7.1

---

**Plan Details Reference:**

| Feature | Fundamentals ($16.95/mo) | 360 ($29.95/mo) |
|---------|-------------------------|-----------------|
| Target audience | Small businesses, startups | Growing/established businesses |
| Monthly fee waiver | $5,000 min balance | $15,000 min balance |
| Free transactions | 200/month | 500/month |
| Free cash deposits | $7,500/month | $20,000/month |
| Users | 2 | Unlimited |
| Wire transfer fee | $30 domestic / $45 intl | $25 domestic / $35 intl |
| Earnings credit | No | Yes |
| Dedicated support | No | Yes |

---

## Step 7: Review & Submit

### Screen 7.1: Review Pane

**Display:** All collected information organized in sections:

**Identity**
- Name: [value]
- Email: [value]
- Phone: [value]
- ID Type: [Driver's License / Passport / State ID]
- ID Number: [value]

**Business**
- Legal Name: [value from LEI]
- LEI: [value]
- Entity Type: [value]
- Jurisdiction: [value]
- Formation Date: [value]

**Ownership/Authorization**
- Your Role: [Owner / Member (X%) / Partner (X%) / Shareholder (X%) / Officer / Authorized Representative]

**Business Details**
- Website: [value or "None"]
- International Operations: [Yes - countries / No]
- Business Address: [value or "None"]

**Financial Profile**
- Annual Revenue: [value]
- Monthly Deposits: [value]
- Monthly Withdrawals: [value]
- Cash Deposits: [value]%
- Cash Withdrawals: [value]%

**Selected Products & Services**
- ✓ Business Checking Account
- ✓ [other selected products from Screen 6.7]

**Selected Account**
- [Business Advantage Fundamentals / Business Advantage 360] - $[16.95 / 29.95] per month

**Documents Uploaded**
- ✓ Government ID ([type])
- ✓ [Formation document based on entity type]
- ✓ [Ownership document based on entity type]
- ✓ POA (if applicable)
- ✓ Resolution (if applicable)
- ✓ Proof of Address

**Actions:**
- "Edit" links next to each section
- "Continue" button

**Next:** → 7.2

### Screen 7.2: Declaration

**Display:**
"By submitting this application, I confirm that:

- All information provided is accurate and complete to the best of my knowledge
- All documents uploaded are genuine and unaltered
- I am authorized to open this account on behalf of the business
- I understand the account will be subject to Bank of America's Business Account Agreement
- I agree to the Terms of Service, Privacy Policy, and Electronic Communications Agreement
- I certify under penalties of perjury that my taxpayer identification number is correct (W-9 certification)"

**Input:** Checkbox to agree + Signature field (type name)
**Actions:** "Submit Application" button
**Next:** → 7.3

### Screen 7.3: Success

**Display:**
"🎉 Application Submitted!

Thank you for your application. Our team will review it within 1-3 business days.

You'll receive updates at: [email]

Application Reference: [generated reference number]

**What's Next:**
- We'll verify your documents and business information
- You may be contacted if we need additional information
- Once approved, you'll receive your account details and debit card by mail

**While you wait:**
- Download the Bank of America mobile app
- Set up your online banking profile"

**Actions:** "Done" button

---

## Flow Conditions Reference

### requiresPOA

```
requiresPOA = true when:
- entity_type = "Sole Proprietorship" AND verified_name ≠ owner_name
- entity_type = "LLC" AND verified_name ∉ member_names[]
- entity_type IN ["General Partnership", "Limited Partnership", "LLP"] AND verified_name ∉ partner_names[]
- entity_type IN ["Corporation", "S-Corporation"] AND verified_name ∉ shareholder_names[] AND verified_name ∉ officer_names[]
```

### requiresResolution

```
requiresResolution = true when:
- entity_type = "LLC" AND member_count > 1
- entity_type IN ["General Partnership", "Limited Partnership", "LLP"] (always)
- entity_type IN ["Corporation", "S-Corporation"] AND shareholder_count > 1
```

### Plan Recommendation Logic

```
IF payroll_services selected (from Screen 6.7) → Business Advantage 360
ELSE IF owner_count > 1 → Business Advantage 360
ELSE IF entity_type IN ["Corporation", "S-Corporation"] → Business Advantage 360
ELSE IF revenue_index >= 4 (from Screen 6.1) → Business Advantage 360
ELSE IF monthly_deposits_index >= 3 (from Screen 6.3) → Business Advantage Fundamentals
ELSE → Business Advantage Fundamentals
```

### Product Pre-selection Conditions

```
preselect_international_wires = international_operations == true
preselect_fx_services = international_operations == true
preselect_multi_user = owner_count > 1
preselect_merchant_services = online_presence == true
preselect_pos = physical_address == true
preselect_payroll = entity_type IN ["Corporation", "LLC", "Partnership"] AND revenue_index >= 3
```

Where `revenue_index` maps to:
- 0: Less than $50,000
- 1: $50,000 - $100,000
- 2: $100,000 - $250,000
- 3: $250,000 - $500,000
- 4: $500,000 - $1 million
- 5: $1 million - $5 million
- 6: $5 million - $10 million
- 7: More than $10 million

---

## Entity Type to Document Mapping

| Entity Type | Formation Document | Ownership Document | Authorization Docs (if not owner) |
|-------------|-------------------|-------------------|-----------------------------------|
| Sole Proprietorship | DBA Certificate (optional) | N/A | POA |
| LLC (Single-Member) | Articles of Organization | Operating Agreement | POA |
| LLC (Multi-Member) | Articles of Organization | Operating Agreement | POA + LLC Resolution |
| General Partnership | Partnership Agreement | Partnership Agreement | POA + Partnership Resolution |
| Limited Partnership | Partnership Agreement | Partnership Agreement | POA + Partnership Resolution |
| LLP | Partnership Agreement | Partnership Agreement | POA + Partnership Resolution |
| Corporation | Articles of Incorporation | Bylaws / Stock Ledger | POA + Corporate Resolution |
| S-Corporation | Articles of Incorporation | Bylaws / Stock Ledger | POA + Corporate Resolution |

---

## GLEIF API Integration Reference

**Endpoint:** `https://api.gleif.org/api/v1/lei-records/{LEI}`

**Response fields used:**

| GLEIF Field | Maps To |
|-------------|---------|
| `data.attributes.entity.legalName.name` | Legal Name |
| `data.attributes.entity.legalForm.id` | Entity Type Code |
| `data.attributes.entity.legalForm.other` | Entity Type Description |
| `data.attributes.entity.jurisdiction` | Jurisdiction |
| `data.attributes.entity.legalAddress` | Registered Address |
| `data.attributes.entity.headquartersAddress` | Headquarters Address |
| `data.attributes.entity.creationDate` | Formation Date |
| `data.attributes.entity.status` | Entity Status |
| `data.attributes.registration.status` | LEI Status |