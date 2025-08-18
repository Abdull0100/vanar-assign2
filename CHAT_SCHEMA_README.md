# Chat Schema Documentation

## Overview
The chat system has been restructured to provide a clear, room-based architecture where each message is individually linked to its user and conversation room.

## Database Schema

### Tables

#### 1. `conversations` (Chat Rooms)
- **id**: Unique identifier for the conversation/room
- **userId**: Owner of the conversation
- **roomName**: Display name for the chat room
- **createdAt**: When the room was created
- **updatedAt**: Last activity in the room

#### 2. `chatMessages` (Individual Messages)
- **id**: Unique message identifier
- **conversationId**: Links message to specific conversation/room
- **userId**: User who sent the message
- **content**: The actual message content
- **sender**: Either 'user' or 'ai'
- **aiResponse**: Optional AI response (null if no response)
- **createdAt**: Timestamp of the message

#### 3. `users` (User Accounts)
- **id**: Unique user identifier
- **name**: Display name
- **email**: User's email address
- **role**: User role (user/admin)
- **createdAt/updatedAt**: Account timestamps

## Key Design Principles

### 1. **No Message Grouping**
- Each message is stored separately
- No artificial grouping of user/AI message pairs
- Each message has its own `conversationId` reference

### 2. **Room-Based Structure**
- `conversationId` represents a chat room
- All messages in a room share the same `conversationId`
- Rooms can contain any number of messages

### 3. **Explicit Sender Identification**
- `sender` field clearly identifies message origin
- Values: 'user' or 'ai'
- No ambiguity about who sent what

### 4. **Optional AI Responses**
- `aiResponse` field can be null
- Null indicates no AI response exists
- Explicit handling of incomplete conversations

## JSON Structure

The system outputs data in this exact format:

```json
{
  "userId": "User_101",
  "conversations": [
    {
      "conversationId": "room_123",
      "roomName": "General Chat",
      "messages": [
        {
          "messageId": "msg_1",
          "content": "Hello Ai!",
          "timestamp": "2023-10-01T12:00:00Z",
          "sender": "user",
          "aiResponse": "Hello there"
        },
        {
          "messageId": "msg_2",
          "content": "Hi there!",
          "timestamp": "2023-10-01T12:01:00Z",
          "sender": "user",
          "aiResponse": "Hello there"
        }
      ]
    }
  ]
}
```

## Database Relationships

```
users (1) ←→ (many) conversations
users (1) ←→ (many) chatMessages
conversations (1) ←→ (many) chatMessages
```

### Foreign Key Constraints
- **Cascade Delete**: Deleting a user removes all their conversations and messages
- **Cascade Delete**: Deleting a conversation removes all its messages
- **Referential Integrity**: All messages must reference valid users and conversations

## Performance Optimizations

### Indexes
- `idx_chatMessages_conversationId`: Fast conversation message retrieval
- `idx_chatMessages_userId`: Fast user message retrieval
- `idx_conversations_userId`: Fast user conversation retrieval

### Query Patterns
- **Get user's conversations**: Query by `userId` on conversations table
- **Get room messages**: Query by `conversationId` on chatMessages table
- **Get user's messages**: Query by `userId` on chatMessages table

## Migration

The schema includes a migration (`0002_restructure_chat_schema.sql`) that:
1. Creates new tables with the correct structure
2. Migrates existing data to the new format
3. Drops old tables and renames new ones
4. Creates performance indexes

## Usage Examples

### Creating a New Room
```typescript
const newRoom = await db.insert(conversations).values({
  userId: user.id,
  roomName: "My New Chat Room"
});
```

### Adding a User Message
```typescript
const userMessage = await db.insert(chatMessages).values({
  conversationId: roomId,
  userId: user.id,
  content: "Hello AI!",
  sender: "user",
  aiResponse: null
});
```

### Adding an AI Response
```typescript
const aiMessage = await db.insert(chatMessages).values({
  conversationId: roomId,
  userId: user.id,
  content: "Hello there!",
  sender: "ai",
  aiResponse: null
});
```

### Getting Room Messages
```typescript
const roomMessages = await db.query.chatMessages.findMany({
  where: eq(chatMessages.conversationId, roomId),
  orderBy: asc(chatMessages.createdAt)
});
```

## Benefits

1. **Clear Structure**: Each message is individually identifiable
2. **Room Isolation**: Messages are properly contained within conversations
3. **Flexible Responses**: AI responses are optional and clearly marked
4. **Performance**: Optimized indexes for common query patterns
5. **Scalability**: Can handle large numbers of messages per room
6. **Data Integrity**: Foreign key constraints prevent orphaned data
