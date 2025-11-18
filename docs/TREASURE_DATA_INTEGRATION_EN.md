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
     - **Rich Menu Switch** ← Dynamically switch menus based on user actions

   **How to Configure Rich Menu Switch Action:**

   a. **Configure Action in Rich Menu Editor**
      ```
      Action Type: Rich Menu Switch
      Target Rich Menu Alias ID: next-menu-alias
      Data: user-action-data
      ```

   b. **Set Alias in LINE Developers Console**
      ```
      Messaging API > Rich menus > Rich menu aliases
      Rich Menu ID: richmenu-xxxxx
      Alias: next-menu-alias
      ```

   c. **When user taps, it automatically switches to the specified alias rich menu**

5. **Export JSON**
   - Click "JSON Preview" button
   - Copy JSON with "Copy JSON" button

---

## Step 2: Get Channel Access Token

### 2.1 Access LINE Developers Console

1. **Login to LINE Developers Console**
   - https://developers.line.biz/console/

2. **Get Channel Access Token**
   - Select your channel
   - Open `Messaging API` tab
   - In `Channel access token` section, click "Issue"
   - Copy the issued token

   ⚠️ **Note**: The token is displayed only once, so make sure to copy and save it securely

---

## Step 3: Create and Register Rich Menu

### 3.1 Use "LINE API Integration" Feature in This App

1. **Open "LINE API Integration" in Rich Menu Editor**
   - Click "LINE API Integration" button in the top right

2. **Enter Channel Access Token**
   - Paste the token obtained in Step 2 into the input field

3. **Create Rich Menu**
   - Click "Create Rich Menu" button
   - The app will automatically:
     - Create rich menu in LINE API
     - Auto-upload background image
     - Obtain Rich Menu ID

4. **Copy Rich Menu ID**
   - After successful creation, Rich Menu ID will be displayed
   - Format: `richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Click "Copy" button to copy to clipboard
   - **Use this ID in Treasure Data**

   ⚠️ **Note**: Rich menus created via API are not displayed in LINE Developers Console management screen. Use the "Get Existing Menus" feature in this app to verify them.

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
   Name: LINE Rich Menu Delivery
   Description: Rich menu distribution connector
   ```

### 4.2 Configure Authentication

**Enter Channel Access Token**
- Paste the token obtained in Step 2

### 4.3 Rich Menu Distribution Settings

1. **Select Action Type**
   ```
   Action Type: Link Rich Menu
   ```

2. **Specify Rich Menu ID**
   ```
   Rich Menu ID: richmenu-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   ⚠️ **Important**: Enter the exact Rich Menu ID from Step 3

3. **Mapping Configuration**
   ```
   User ID Column: line_user_id
   ```

---

## Step 5: Create Segments in Treasure Data

### 5.1 Define Segments in Audience Studio

1. **Access Audience Studio**
   ```
   Treasure Data Console > Audiences > Segments
   ```

2. **Create New Segment**
   - Create a segment query that includes `user_id` and `line_user_id` from your table
   - Specify delivery conditions (purchase amount, registration date, etc.)

3. **Set Segment Name**
   - e.g., `line_vip_users`, `line_new_users`

### 5.2 Configure Distribution Schedule

1. **Set Schedule**
   ```
   Frequency: One-time / Daily / Weekly / Monthly
   Time Zone: Asia/Tokyo
   Start Time: 09:00
   ```

2. **Select Connector**
   - Choose the connector created in Step 4

---

## Step 6: Activate in Audience Studio

### 6.1 Audience Activation

1. **Access Audience > Activations**

2. **Create New Activation**
   ```
   Destination: LINE Messaging API
   Segment: line_vip_users
   Connector: LINE Rich Menu - VIP Users
   ```

3. **Start Distribution**
   - Click "Activate" button

### 6.2 Monitor Distribution

1. **Check Activation History**
   ```
   Status: Running / Completed / Failed
   Delivered: Number of successful deliveries
   Failed: Number of failed deliveries
   ```

---

## Step 7: Distributing to Multiple Segments

### 7.1 Basic Rule

**Important:** Each Activation can only configure one rich menu.

```
1 Segment = 1 Rich Menu = 1 Activation
```

### 7.2 Distributing to Multiple Segments

To distribute different rich menus to different segments, **repeat Steps 1-6 for each segment**.

**Example: Distributing to 3 Segments**

| Segment | Rich Menu ID | Activation Name |
|---------|--------------|-----------------|
| VIP Users | richmenu-vip-xxxxx | LINE Rich Menu - VIP Users |
| Regular Users | richmenu-standard-xxxxx | LINE Rich Menu - Standard Users |
| New Users | richmenu-welcome-xxxxx | LINE Rich Menu - New Users |

**Process:**
1. Create rich menu for VIP users (Steps 1-3)
2. Create connector for VIP users (Step 4)
3. Create VIP user segment (Step 5)
4. Execute activation for VIP users (Step 6)
5. Repeat 1-4 for Regular users
6. Repeat 1-4 for New users

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
