-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'video', 'audio', 'document', 'location', 'contact');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "phone" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "about" TEXT NOT NULL DEFAULT 'Hey there! I am using OpenCommStack',
    "avatar" TEXT,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'id',
    "privacyLastSeen" TEXT NOT NULL DEFAULT 'everyone',
    "privacyAvatar" TEXT NOT NULL DEFAULT 'everyone',
    "privacyAbout" TEXT NOT NULL DEFAULT 'everyone',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");

-- CreateTable
CREATE TABLE IF NOT EXISTS "Contact" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Contact_userId_contactId_key" ON "Contact"("userId", "contactId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "Chat" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChatMember" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ChatMember_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ChatMember_chatId_userId_key" ON "ChatMember"("chatId", "userId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT,
    "encryptedContent" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "replyToId" TEXT,
    "isForwarded" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliveredTo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MessageReaction" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MessageReaction_messageId_userId_key" ON "MessageReaction"("messageId", "userId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "Status" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "bgColor" TEXT DEFAULT '#075E54',
    "audience" TEXT NOT NULL DEFAULT 'everyone',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Status_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "StatusView" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "statusId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusView_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StatusView_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StatusView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "StatusView_statusId_userId_key" ON "StatusView"("statusId", "userId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "Call" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "initiatorId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'voice',
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ringing',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Call_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Call_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CallParticipant" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "callId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ringing',
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    CONSTRAINT "CallParticipant_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CallParticipant_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CallParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CallParticipant_callId_userId_key" ON "CallParticipant"("callId", "userId");
