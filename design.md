# CrickPro Mobile App - Design Document

## Overview

CrickPro is a comprehensive cricket scoring and tournament management platform designed for grassroots and amateur cricket. The app prioritizes a superior UI/UX experience compared to CricHeroes, with smooth transitions, clear visual hierarchy, and intuitive navigation optimized for live match scoring and team management.

## Design Principles

- **Mobile-First Portrait (9:16):** All screens optimized for portrait orientation with one-handed usage in mind
- **Apple HIG Alignment:** Follows iOS Human Interface Guidelines for a native, polished feel
- **Clear Visual Hierarchy:** Key information (batsman, bowler, runs, balls, wickets) is immediately visible and scannable
- **Smooth Transitions:** Subtle animations enhance usability without distraction
- **Accessibility:** Large tap targets, readable fonts, sufficient color contrast
- **Performance:** Lightweight components, efficient re-renders, smooth 60fps scrolling

## Screen List

### Authentication & Onboarding
1. **Splash Screen** - App logo and branding
2. **Sign In / Sign Up** - Phone OTP, email, Google/Apple SSO
3. **Profile Setup** - Player details (name, photo, role, batting/bowling style, city, jersey number)
4. **Role Selection** - Scorer, Player, Tournament Organizer, Umpire

### Core Navigation (Tab Bar)
1. **Home** - Dashboard with quick access to active matches, upcoming fixtures, and notifications
2. **Scorecard** - Live scoring interface (core feature)
3. **Leagues & Tournaments** - Browse and manage tournaments
4. **Player Stats** - Personal career statistics and achievements
5. **Profile** - User profile, settings, and preferences

### Home Screen
- **Active Matches Widget** - List of ongoing matches with live score summary
- **Upcoming Fixtures** - Next scheduled matches for user's teams
- **Quick Actions** - Create new match, join league, view notifications
- **Recent Scorecards** - Recently completed matches for quick access

### Live Scorecard (Primary Feature)
1. **Match Header** - Team names, current score, overs, wickets, required run rate
2. **Batsman Info Panel** - Current batsman details (name, runs, balls, strike rate)
3. **Bowler Info Panel** - Current bowler details (name, overs, runs conceded, economy rate)
4. **Scoring Buttons** - 0, 1, 2, 3, 4, 6 runs with quick extras (wide, no-ball, bye, leg-bye)
5. **Wicket Button** - Dismissal type selector (bowled, caught, LBW, etc.)
6. **Undo/Edit** - Undo last ball, edit innings, full innings correction
7. **Match Summary** - Fall of wickets, partnership stats, extras breakdown
8. **Commentary Feed** - Ball-by-ball updates and key moments

### League & Tournament Management
1. **Leagues List** - Browse available leagues, user's leagues
2. **Create League** - Tournament format, structure, teams, schedule
3. **League Details** - Points table, standings, fixtures, results
4. **Tournament Bracket** - Knockout stage visualization
5. **Fixtures & Schedule** - Match schedule with venue and umpire details
6. **Team Registration** - Add teams, manage rosters, assign roles
7. **Organizer Dashboard** - Manage teams, approve join requests, broadcast announcements

### Player Statistics & Profiles
1. **Player Profile** - Photo, role, career summary, achievements
2. **Career Statistics** - Matches, runs, average, strike rate, highest score, centuries/fifties
3. **Bowling Statistics** - Wickets, economy, best figures, catches/stumpings
4. **Format-Wise Split** - Stats by format (T20, ODI, Custom)
5. **Head-to-Head** - Stats vs specific players/teams
6. **Milestones & Badges** - Achievements (50 wickets, century club, etc.)
7. **Team Stats** - Win/loss record, best partnerships, team averages

### Match History & Scorecards
1. **Match History List** - Completed matches with results
2. **Scorecard View** - Full match summary, innings breakdown, player stats
3. **Share Scorecard** - Generate shareable image/text for WhatsApp, Instagram
4. **Match Commentary** - Ball-by-ball replay with key moments

### Settings & Preferences
1. **Account Settings** - Edit profile, change password, linked accounts
2. **Notifications** - Push notification preferences, match alerts
3. **Theme & Display** - Light/dark mode, font size
4. **Privacy & Permissions** - Data sharing, location, camera, contacts
5. **About & Help** - App version, help center, contact support

## Primary Content and Functionality

### Live Scorecard (Core)
The scorecard is the heart of CrickPro, designed for rapid data entry during matches:

| Section | Content | Functionality |
|---------|---------|---------------|
| **Header** | Team names, current score, overs, wickets | Tap to view full match details |
| **Batsman Panel** | Name, runs, balls, strike rate, dismissal status | Tap to view player profile |
| **Bowler Panel** | Name, overs, runs conceded, economy, wickets | Tap to view player profile |
| **Scoring Area** | Large buttons for 0-6 runs, extras, wickets | One-tap scoring for speed |
| **Undo/Edit** | Quick undo, edit last ball, innings correction | Maintain data accuracy |
| **Summary** | Fall of wickets, partnership stats, extras | Contextual information |

### League & Tournament System

| Feature | Details |
|---------|---------|
| **Create Tournament** | Name, format (round-robin, knockout, league), teams, dates, venue |
| **Auto-Generate Fixtures** | Round-robin or knockout scheduling |
| **Manual Scheduling** | Organizer can manually set match dates/times |
| **Points Table** | Auto-updated after each match, NRR calculation for leagues |
| **Team Registration** | Add teams, manage rosters, assign captain/vice-captain |
| **Player Assignment** | Assign players to teams, manage player roles |
| **Venue Management** | Assign venues, track ground availability |
| **Umpire Assignment** | Assign umpires to matches, track assignments |
| **Awards** | Player-of-the-match, player-of-the-tournament |

### Player Statistics

| Metric | Calculation | Display |
|--------|-------------|---------|
| **Strike Rate** | (Runs / Balls) × 100 | Real-time during match, career stats |
| **Economy Rate** | (Runs Conceded / Overs) | Real-time during match, career stats |
| **Average** | Total Runs / Innings (excluding DNB) | Career stats, format-wise |
| **Wickets** | Total dismissals | Career stats, format-wise |
| **Runs Conceded** | Total runs given away | Bowling stats |
| **Best Figures** | Best bowling performance | Career stats |
| **Catches/Stumpings** | Total fielding dismissals | Career stats |

## Key User Flows

### Flow 1: Live Match Scoring
1. User opens app → Home screen
2. Taps "Start New Match" or selects active match
3. Enters match details (teams, format, venue)
4. Navigates to Scorecard tab
5. Enters batsman/bowler names
6. Taps scoring buttons for each ball
7. System auto-calculates runs, strike rate, economy
8. At end of innings, taps "End Innings"
9. At match end, system generates summary scorecard
10. User shares scorecard via WhatsApp/Instagram

### Flow 2: Create and Manage Tournament
1. User (organizer) opens Leagues & Tournaments tab
2. Taps "Create New League"
3. Enters league name, format, number of teams, dates
4. Selects tournament structure (round-robin, knockout)
5. System auto-generates fixtures
6. Organizer assigns venues and umpires
7. Teams register and join league
8. After each match, points table auto-updates
9. User views standings, fixtures, and results
10. At tournament end, awards are assigned

### Flow 3: View Player Profile & Statistics
1. User navigates to Player Stats tab or taps player name
2. Views player profile with photo and basic info
3. Scrolls to see career statistics (runs, average, strike rate)
4. Taps "Format-Wise" to see stats by format
5. Taps "Head-to-Head" to compare with specific players
6. Views achievements and milestone badges
7. Taps "View Matches" to see match history

## Color Palette

CrickPro uses a cricket-inspired color scheme that feels modern and professional:

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary (Teal)** | #0a7ea4 | Buttons, links, active states, accents |
| **Background (Light)** | #ffffff | Screen backgrounds |
| **Background (Dark)** | #151718 | Dark mode backgrounds |
| **Surface (Light)** | #f5f5f5 | Cards, panels, elevated surfaces |
| **Surface (Dark)** | #1e2022 | Dark mode cards |
| **Foreground (Light)** | #11181C | Primary text |
| **Foreground (Dark)** | #ECEDEE | Dark mode text |
| **Muted (Light)** | #687076 | Secondary text, disabled states |
| **Muted (Dark)** | #9BA1A6 | Dark mode secondary text |
| **Border (Light)** | #E5E7EB | Dividers, borders |
| **Border (Dark)** | #334155 | Dark mode borders |
| **Success** | #22C55E | Positive states, completed actions |
| **Warning** | #F59E0B | Warnings, alerts |
| **Error** | #EF4444 | Errors, destructive actions |

## Typography

- **Display (Large Titles):** 32px, bold, primary color
- **Heading 1 (Section Titles):** 24px, semibold, foreground
- **Heading 2 (Subsections):** 18px, semibold, foreground
- **Body (Regular Text):** 16px, regular, foreground
- **Body Small (Secondary Text):** 14px, regular, muted
- **Caption (Labels, Stats):** 12px, regular, muted
- **Monospace (Numbers, Scores):** 16-20px, semibold, primary

## Spacing & Layout

- **Padding:** 16px standard, 8px compact, 24px generous
- **Gap (Between Items):** 12px standard, 8px compact, 16px generous
- **Border Radius:** 12px standard, 8px compact, 16px large
- **Safe Area Insets:** Handled by ScreenContainer component
- **Tab Bar Height:** 56px + safe area bottom inset

## Interaction Patterns

### Button States
- **Default:** Full opacity, normal scale
- **Pressed:** 0.97 scale, slight opacity reduction, haptic feedback
- **Disabled:** 0.5 opacity, no interaction
- **Loading:** Spinner overlay, disabled state

### Transitions
- **Screen Navigation:** 300ms slide/fade transition
- **List Item Selection:** 150ms opacity change
- **Button Press:** 80ms scale animation
- **Modal Appearance:** 250ms fade-in

### Haptic Feedback
- **Button Tap:** Light impact
- **Toggle/Switch:** Medium impact
- **Success:** Success notification
- **Error:** Error notification

## Performance Targets

- **Scorecard Button Response:** < 100ms
- **List Scroll:** 60fps smooth
- **Screen Transition:** 300ms max
- **Data Sync:** < 2s on reconnect
- **Offline Scoring:** Full functionality, sync on reconnect

## Accessibility

- **Tap Targets:** Minimum 44×44pt (iOS standard)
- **Color Contrast:** WCAG AA minimum (4.5:1 for text)
- **Font Sizes:** Minimum 16px for body text
- **Screen Reader:** All interactive elements labeled
- **Keyboard Navigation:** Full support on web
- **Haptic Feedback:** Optional, can be disabled in settings
