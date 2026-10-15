# CommercePilot UI design system — revision 2

UI/UX Pro Max searches: enterprise data dashboard; SaaS enterprise dashboard (color); dashboard readable modern (typography).
Applied the data-focused dashboard guidance and indigo SaaS palette; avoided the financial-dashboard dark-only direction. Fira Sans 400/500/600/700 is self-hosted using Fontsource. Its sans family suits business text and data; monospace display headings were not used because they would overemphasize the technical feel.

## Colors

Canvas #F6F7FB; surfaces #FFFFFF; primary ink #20283D; secondary text #626C80; indigo action #4F46E5; sidebar #161E31. Positive statuses use muted green, pending/payment-not-collected uses amber, cancelled/archived uses neutral gray. Status text remains visible so color is never the only distinction. Dark theme uses independent semantic tokens.

## Hierarchy and layout

34px desktop headings, 28px mobile headings. Body 15px; supporting text mostly 12–14px. Cards use 13px corners, subtle borders/shadows and generous internal spacing. Sidebar groups sales, customer care and management; user identity is visible in the topbar on wide screens. Icons share one outline family. Main action buttons have 44px minimum targets. Visible keyboard focus and a skip-to-content link are provided.

Use plain task-focused copy: Store overview, No order activity yet, Product catalog. Charts reflect stored records; no fabricated trends. Demo labels remain explicit on the hosted preview. A bug in substring-based status matching was fixed: Not Collected no longer inherits the Collected green state.

Responsive: 4 metric columns on desktop, 2 on tablet/phone, 1 below 380px. Navigation becomes horizontally scrollable below 900px. Tables scroll in their own containers; cards stack. Reduced motion is respected. Browser visual QA remains unexecuted because no supported browser control is available in this runtime; builds and static color contrast checks are performed.
