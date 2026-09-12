CREATE TABLE `delivery_addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(80) NOT NULL,
	`addressLine` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`postalCode` varchar(24) NOT NULL,
	`landmark` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `delivery_addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(80) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`imageUrl` text,
	`dietary` varchar(80),
	`spicyLevel` int NOT NULL DEFAULT 0,
	`isAvailable` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`menuItemId` int,
	`nameSnapshot` varchar(160) NOT NULL,
	`priceSnapshot` decimal(10,2) NOT NULL,
	`quantity` int NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`customerName` varchar(160) NOT NULL,
	`customerPhone` varchar(32) NOT NULL,
	`fulfillmentType` enum('delivery','pickup') NOT NULL DEFAULT 'delivery',
	`status` enum('new','confirmed','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'new',
	`addressSnapshot` text,
	`notes` text,
	`subtotal` decimal(10,2) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`guestName` varchar(160) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`partySize` int NOT NULL,
	`reservationDate` varchar(32) NOT NULL,
	`reservationTime` varchar(16) NOT NULL,
	`status` enum('requested','confirmed','seated','completed','cancelled') NOT NULL DEFAULT 'requested',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`)
);
