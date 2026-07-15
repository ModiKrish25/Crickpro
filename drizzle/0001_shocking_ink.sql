CREATE TABLE `balls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inningsId` int,
	`overNumber` int,
	`ballNumber` int,
	`batsmanId` int,
	`bowlerId` int,
	`runs` int DEFAULT 0,
	`extras` int DEFAULT 0,
	`extraType` varchar(50),
	`isWicket` int DEFAULT 0,
	`dismissalType` varchar(50),
	`fielderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `balls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batsmanScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inningsId` int,
	`playerId` int,
	`runs` int DEFAULT 0,
	`balls` int DEFAULT 0,
	`fours` int DEFAULT 0,
	`sixes` int DEFAULT 0,
	`dismissalType` varchar(50),
	`fielderId` int,
	`status` varchar(50) DEFAULT 'batting',
	CONSTRAINT `batsmanScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bowlerStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inningsId` int,
	`playerId` int,
	`overs` int DEFAULT 0,
	`balls` int DEFAULT 0,
	`runs` int DEFAULT 0,
	`wickets` int DEFAULT 0,
	`maidens` int DEFAULT 0,
	CONSTRAINT `bowlerStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `innings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int,
	`teamId` int,
	`inningsNumber` int,
	`totalRuns` int DEFAULT 0,
	`totalWickets` int DEFAULT 0,
	`totalOvers` int DEFAULT 0,
	`totalBalls` int DEFAULT 0,
	`status` varchar(50) DEFAULT 'in-progress',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `innings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leagueStandings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leagueId` int,
	`teamId` int,
	`played` int DEFAULT 0,
	`won` int DEFAULT 0,
	`lost` int DEFAULT 0,
	`tied` int DEFAULT 0,
	`points` int DEFAULT 0,
	`nrr` int DEFAULT 0,
	`runsFor` int DEFAULT 0,
	`runsAgainst` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leagueStandings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leagueTeams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leagueId` int,
	`teamId` int,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leagueTeams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leagues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`format` varchar(50) DEFAULT 'round-robin',
	`matchFormat` varchar(50) DEFAULT 'T20',
	`numberOfTeams` int,
	`organizerId` int,
	`startDate` timestamp,
	`endDate` timestamp,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leagues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leagueId` int,
	`team1Id` int,
	`team2Id` int,
	`format` varchar(50) DEFAULT 'T20',
	`status` varchar(50) DEFAULT 'scheduled',
	`venue` varchar(255),
	`umpireId` int,
	`scorerId` int,
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerCareerStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int,
	`format` varchar(50) DEFAULT 'T20',
	`matchesPlayed` int DEFAULT 0,
	`innings` int DEFAULT 0,
	`runsScored` int DEFAULT 0,
	`highestScore` int DEFAULT 0,
	`average` int DEFAULT 0,
	`strikeRate` int DEFAULT 0,
	`centuries` int DEFAULT 0,
	`fifties` int DEFAULT 0,
	`fours` int DEFAULT 0,
	`sixes` int DEFAULT 0,
	`ballsBowled` int DEFAULT 0,
	`runsConceded` int DEFAULT 0,
	`wicketsTaken` int DEFAULT 0,
	`economyRate` int DEFAULT 0,
	`bestFigures` varchar(50),
	`catches` int DEFAULT 0,
	`stumpings` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playerCareerStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`role` varchar(50) DEFAULT 'batsman',
	`battingStyle` varchar(50),
	`bowlingStyle` varchar(50),
	`city` varchar(100),
	`jerseyNumber` int,
	`bio` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int,
	`playerId` int,
	`role` varchar(50) DEFAULT 'player',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`logoUrl` text,
	`homeGround` varchar(255),
	`teamColor` varchar(7) DEFAULT '#0a7ea4',
	`captainId` int,
	`viceCaptainId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `balls` ADD CONSTRAINT `balls_inningsId_innings_id_fk` FOREIGN KEY (`inningsId`) REFERENCES `innings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `balls` ADD CONSTRAINT `balls_batsmanId_players_id_fk` FOREIGN KEY (`batsmanId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `balls` ADD CONSTRAINT `balls_bowlerId_players_id_fk` FOREIGN KEY (`bowlerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `balls` ADD CONSTRAINT `balls_fielderId_players_id_fk` FOREIGN KEY (`fielderId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batsmanScores` ADD CONSTRAINT `batsmanScores_inningsId_innings_id_fk` FOREIGN KEY (`inningsId`) REFERENCES `innings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batsmanScores` ADD CONSTRAINT `batsmanScores_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batsmanScores` ADD CONSTRAINT `batsmanScores_fielderId_players_id_fk` FOREIGN KEY (`fielderId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bowlerStats` ADD CONSTRAINT `bowlerStats_inningsId_innings_id_fk` FOREIGN KEY (`inningsId`) REFERENCES `innings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bowlerStats` ADD CONSTRAINT `bowlerStats_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `innings` ADD CONSTRAINT `innings_matchId_matches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `innings` ADD CONSTRAINT `innings_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leagueStandings` ADD CONSTRAINT `leagueStandings_leagueId_leagues_id_fk` FOREIGN KEY (`leagueId`) REFERENCES `leagues`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leagueStandings` ADD CONSTRAINT `leagueStandings_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leagueTeams` ADD CONSTRAINT `leagueTeams_leagueId_leagues_id_fk` FOREIGN KEY (`leagueId`) REFERENCES `leagues`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leagueTeams` ADD CONSTRAINT `leagueTeams_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leagues` ADD CONSTRAINT `leagues_organizerId_users_id_fk` FOREIGN KEY (`organizerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_leagueId_leagues_id_fk` FOREIGN KEY (`leagueId`) REFERENCES `leagues`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_team1Id_teams_id_fk` FOREIGN KEY (`team1Id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_team2Id_teams_id_fk` FOREIGN KEY (`team2Id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_umpireId_users_id_fk` FOREIGN KEY (`umpireId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_scorerId_users_id_fk` FOREIGN KEY (`scorerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playerCareerStats` ADD CONSTRAINT `playerCareerStats_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `players` ADD CONSTRAINT `players_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teamMembers` ADD CONSTRAINT `teamMembers_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teamMembers` ADD CONSTRAINT `teamMembers_playerId_players_id_fk` FOREIGN KEY (`playerId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teams` ADD CONSTRAINT `teams_captainId_players_id_fk` FOREIGN KEY (`captainId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teams` ADD CONSTRAINT `teams_viceCaptainId_players_id_fk` FOREIGN KEY (`viceCaptainId`) REFERENCES `players`(`id`) ON DELETE no action ON UPDATE no action;