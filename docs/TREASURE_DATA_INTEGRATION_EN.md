# Treasure Data x LINE Rich Menu Distribution Guide

## Overview

This guide explains how to distribute different rich menus to segmented users using Treasure Data's Audience Studio and LINE Messaging API integration.

## Architecture

```
[Rich Menu Editor] → [LINE Developers] → [Treasure Data] → [LINE Users]
      ↓                      ↓                    ↓
  Design Creation      Rich Menu Registration  Segment Distribution
```

---

## Step 1: Create Rich Menu

### 1.1 Design with Rich Menu Editor

1. **Access the Application**
   - URL: https://toru-takahashi.github.io/line-richmenu-editor/

2. **Enter Basic Settings**
   ```
   Menu Name: e.g., VIP User Menu
   Chat Bar Text: e.g., Open Menu
   Default Open: Yes/No
   ```

3. **Upload Background Image**
   - Recommended size: 2500 x 1686 px
   - Format: JPEG or PNG
   - File size: Max 1MB

4. **Configure Tap Areas**
   - Select from templates or create manually
   - Set actions for each area:
     - Open URL
     - Send message
     - Postback
     - **Rich Menu Switch** ← Important for segment distribution

5. **Export JSON**
   - Click "JSON Preview" button
   - Copy JSON with "Copy JSON" button

---

## Step 2: Register Rich Menu on LINE Developers

### 2.1 Using LINE Official Account Manager

1. **Login to LINE Official Account Manager**
   - https://manager.line.biz/

2. **Create Rich Menu**
   - Home > Rich menus > Create
   - Input image and action settings from Step 1

3. **Get Rich Menu ID**
   - Copy ID from rich menu list
   - Format: `richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2.2 Using LINE Messaging API (Recommended)

1. **Login to LINE Developers Console**
   - https://developers.line.biz/console/

2. **Get Channel Access Token**
   ```
   Settings > Messaging API > Channel access token
   ```

3. **Create Rich Menu via API**

   Use "LINE API Integration" feature in this app:

   a. **Enter Channel Access Token**

   b. **Click "Create Rich Menu"**

   c. **Copy Rich Menu ID**
      - Format: `richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
      - Use this ID in Treasure Data

4. **Upload Image**
   - Use "Upload Rich Menu Image" feature
   - Or upload manually via API panel

---

## Step 3: Create Segments in Treasure Data

### 3.1 Define Segments in Audience Studio

1. **Access Audience Studio**
   ```
   Treasure Data Console > Audiences > Segments
   ```

2. **Create New Segment**

   **Example 1: VIP Users**
   ```sql
   SELECT
     user_id,
     line_user_id
   FROM
     user_master
   WHERE
     total_purchase_amount >= 100000
     AND last_purchase_date >= TD_TIME_ADD(TD_SCHEDULED_TIME(), '-30d')
   ```

   **Example 2: New Users**
   ```sql
   SELECT
     user_id,
     line_user_id
   FROM
     user_master
   WHERE
     registration_date >= TD_TIME_ADD(TD_SCHEDULED_TIME(), '-7d')
   ```

3. **Set Segment Name**
   - e.g., `line_vip_users`, `line_new_users`

---

## Step 4: Configure LINE Messaging API Connector

### 4.1 Create Connector

1. **Access Integrations**
   ```
   Treasure Data Console > Integrations > Catalog
   ```

2. **Search for LINE Messaging API**
   - Select "LINE Messaging API"

3. **Basic Settings**
   ```
   Name: LINE Rich Menu - VIP Users
   Description: Rich menu distribution for VIP users
   ```

### 4.2 Configure Authentication

1. **Enter Channel Access Token**
   ```
   LINE Developers Console > Settings > Messaging API
   → Copy and paste Channel access token
   ```

### 4.3 Rich Menu Distribution Settings

1. **Select Action Type**
   ```
   Action Type: Link Rich Menu
   ```

2. **Specify Rich Menu ID**
   ```
   Rich Menu ID: richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   ⚠️ **Important**: Enter the exact Rich Menu ID from Step 2

3. **Mapping Configuration**
   ```
   User ID Column: line_user_id
   (Column name containing LINE user IDs in your Treasure Data table)
   ```

### 4.4 Schedule Configuration

1. **Set Schedule**
   ```
   Frequency: One-time / Daily / Weekly / Monthly
   Time Zone: Asia/Tokyo
   Start Time: 09:00
   ```

2. **Select Segment**
   - Choose the segment created in Step 3

---

## Step 5: Activate in Audience Studio

### 5.1 Audience Activation

1. **Access Audience > Activations**

2. **Create New Activation**
   ```
   Destination: LINE Messaging API
   Segment: line_vip_users
   Connector: LINE Rich Menu - VIP Users
   ```

3. **Start Distribution**
   - Click "Activate" button

### 5.2 Monitor Distribution

1. **Check Activation History**
   ```
   Status: Running / Completed / Failed
   Delivered: Number of successful deliveries
   Failed: Number of failed deliveries
   ```

---

## Step 6: Segment-based Rich Menu Switching

### 6.1 Managing Multiple Rich Menus

For distributing different rich menus to different segments:

**Pattern 1: By User Attributes**
```
VIP Users      → richmenu-vip-xxxxx (with special offers)
Regular Users  → richmenu-standard-xxxxx (basic menu)
New Users      → richmenu-welcome-xxxxx (with tutorial)
```

**Pattern 2: By Behavior History**
```
Purchased      → richmenu-purchased-xxxxx (repeat purchase promotion)
Cart Abandoned → richmenu-cart-abandoned-xxxxx (purchase promotion)
Browsed Only   → richmenu-browsed-xxxxx (interest building)
```

### 6.2 Rich Menu Switch Action

For dynamic menu switching based on user actions:

1. **Configure Action in Rich Menu Editor**
   ```
   Action Type: Rich Menu Switch
   Target Rich Menu Alias ID: next-menu-alias
   Data: user-action-data
   ```

2. **Set Alias in LINE Developers Console**
   ```
   Rich Menu ID: richmenu-xxxxx
   Alias: next-menu-alias
   ```

3. **Configure Switch Trigger in Treasure Data**
   - Receive postback data via Webhook
   - Dynamically update segments
   - Distribute new rich menu

---

## Data Flow Diagram

```
┌─────────────────────┐
│  Treasure Data DB   │
│  ┌───────────────┐  │
│  │ User Master   │  │
│  │ - user_id     │  │
│  │ - line_user_id│  │
│  │ - attributes  │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Audience Studio    │
│  ┌───────────────┐  │
│  │ Segment Query │  │
│  │ WHERE total > │  │
│  │ 100000        │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  LINE Connector     │
│  ┌───────────────┐  │
│  │ Rich Menu ID  │  │
│  │ richmenu-xxx  │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  LINE Platform      │
│  ┌───────────────┐  │
│  │ Rich Menu     │  │
│  │ Delivery      │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │
           ▼
     ┌─────────┐
     │ User A  │ VIP Menu
     └─────────┘
     ┌─────────┐
     │ User B  │ Standard Menu
     └─────────┘
```

---

## Best Practices

### 1. Rich Menu Design

✅ **DO**
- Provide clear value proposition for each user segment
- Make tap areas finger-friendly (minimum 100x100px)
- Place important actions in prominent positions
- Test image and action settings in advance

❌ **DON'T**
- Don't create more than 20 tap areas
- Avoid tap areas that are too small
- Don't use completely different designs between segments (maintain brand consistency)

### 2. Segment Management

✅ **DO**
- Document segment definitions clearly
- Monitor segment sizes regularly
- Avoid overlaps (users shouldn't belong to multiple segments)
- Set appropriate segment update frequency

❌ **DON'T**
- Don't create segments that are too small (<100 users)
- Avoid overly complex segment conditions
- Don't use real-time updates when not necessary

### 3. Distribution Schedule

✅ **DO**
- Distribute during users' active hours
- A/B test to find optimal distribution timing
- Measure effectiveness after distribution

❌ **DON'T**
- Avoid late night or early morning distribution
- Don't distribute to same users multiple times in short period
- Don't forget to configure retry settings for distribution errors

### 4. Monitoring

Regularly check these metrics:

```
- Delivery Success Rate: (Success / Attempts) × 100
- Tap Rate: Taps / Views
- Conversion Rate: Purchases / Taps
- Error Rate: Errors / Attempts
```

---

## Troubleshooting

### Q1. Rich Menu Not Distributed

**Causes**
- Invalid Channel Access Token
- Incorrect Rich Menu ID
- User has blocked the account

**Solutions**
```
1. Reissue Token in LINE Developers Console
2. Verify Rich Menu ID (richmenu-xxxxx format)
3. Exclude blocked users in segment query
   WHERE is_blocked = false
```

### Q2. Only Some Users Receive Distribution

**Causes**
- Incorrect segment query
- Inaccurate line_user_id mapping

**Solutions**
```sql
-- Check segment size
SELECT COUNT(DISTINCT line_user_id) as user_count
FROM your_segment_table

-- Check for NULL values
SELECT COUNT(*) as null_count
FROM your_segment_table
WHERE line_user_id IS NULL
```

### Q3. Rich Menu Not Displayed

**Causes**
- Image not uploaded
- Invalid image size

**Solutions**
```
1. Check rich menu in LINE Developers Console
   Messaging API > Rich menus
2. Re-upload image (2500x1686px, max 1MB)
3. Use "Upload Rich Menu Image" in Rich Menu Editor
```

### Q4. Tap Areas Not Responding

**Causes**
- Incomplete action configuration
- Overlapping bounds (coordinates)

**Solutions**
```
1. Check action settings in JSON Preview
2. Verify bounds aren't overlapping
   - Validate x, y, width, height values
3. Reconfigure tap areas in Rich Menu Editor
```

---

## API Reference

### Create Rich Menu API

```bash
curl -X POST https://api.line.me/v2/bot/richmenu \
-H 'Authorization: Bearer {CHANNEL_ACCESS_TOKEN}' \
-H 'Content-Type: application/json' \
-d '{
  "size": {
    "width": 2500,
    "height": 1686
  },
  "selected": false,
  "name": "VIP User Menu",
  "chatBarText": "Menu",
  "areas": [
    {
      "bounds": {
        "x": 0,
        "y": 0,
        "width": 833,
        "height": 843
      },
      "action": {
        "type": "uri",
        "uri": "https://example.com/offer"
      }
    }
  ]
}'
```

### Upload Rich Menu Image API

```bash
curl -X POST https://api-data.line.me/v2/bot/richmenu/{richMenuId}/content \
-H 'Authorization: Bearer {CHANNEL_ACCESS_TOKEN}' \
-H 'Content-Type: image/png' \
--data-binary @richmenu-image.png
```

### Link Rich Menu API

```bash
curl -X POST https://api.line.me/v2/bot/user/{userId}/richmenu/{richMenuId} \
-H 'Authorization: Bearer {CHANNEL_ACCESS_TOKEN}'
```

---

## Checklist

### Preparation
- [ ] LINE Official Account created
- [ ] Access to LINE Developers Console
- [ ] Channel Access Token obtained
- [ ] Treasure Data account created
- [ ] Audience Studio access permission

### Rich Menu Creation
- [ ] Prepare background image (2500x1686px)
- [ ] Design with Rich Menu Editor
- [ ] Export JSON
- [ ] Create rich menu via LINE API
- [ ] Save Rich Menu ID

### Treasure Data Configuration
- [ ] Create segment query
- [ ] Verify line_user_id column
- [ ] Create LINE Messaging API connector
- [ ] Configure Rich Menu ID
- [ ] Set distribution schedule

### Testing
- [ ] Verify segment with test users
- [ ] Test rich menu distribution
- [ ] Verify tap action behavior
- [ ] Check error logs

### Production Distribution
- [ ] Verify target segment size
- [ ] Set distribution timing
- [ ] Execute activation
- [ ] Monitor distribution results

---

## Support Resources

### Documentation
- [LINE Messaging API Reference](https://developers.line.biz/en/reference/messaging-api/)
- [Treasure Data Audience Studio](https://docs.treasuredata.com/articles/audience-studio)
- [Rich Menu Editor GitHub](https://github.com/toru-takahashi/line-richmenu-editor)

### Sample Code
- [LINE Bot SDK](https://github.com/line/line-bot-sdk-nodejs)
- [Treasure Data SDK](https://github.com/treasure-data/td-js-sdk)

### Community
- LINE Developers Community
- Treasure Data Community Forum

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-18 | 1.0.0 | Initial release |

---

**Author**: Claude Code
**Last Updated**: 2025-11-18
