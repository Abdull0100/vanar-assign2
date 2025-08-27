# Admin Dashboard Charts

This admin dashboard includes comprehensive charts to visualize user data and system analytics.

## Chart Components

### Current Implementation
- **AdminCharts.svelte**: Adaptive component that tries to use shadcn-svelte charts, falls back to custom SVG charts
- **AdminCustomCharts.svelte**: Custom SVG-based charts using theme-aware colors
- **AdminChartsOverview.svelte**: Full shadcn-svelte implementation (requires chart components)

### Features
- **Activity Trend Chart**: 7-day line chart with area fills showing activity and login patterns
- **User Role Distribution**: Pie chart showing admin vs regular users
- **Verification Status**: Email verification distribution
- **Activity Type Breakdown**: Distribution of different activity types
- **Quick Stats Cards**: Key metrics overview

## Installation (Optional Enhancement)

To enable advanced shadcn-svelte charts with animations and better interactivity:

```bash
pnpm dlx shadcn-svelte@latest add chart
```

After installation, the `AdminCharts` component will automatically detect and use the advanced chart components.

## Chart Types Available

1. **Line Charts**: Activity trends over time with area fills and gradient backgrounds
2. **Pie Charts**: Distribution data (roles, verification status)
3. **Custom SVG Charts**: Fallback implementation with theme support and animations
4. **Progress Bars**: Activity type breakdowns with smooth transitions

## Customization

All charts use CSS custom properties for theming:
- `--chart-1` through `--chart-5` for color schemes
- `--primary`, `--secondary`, etc. for UI elements
- Fully responsive and accessible
- Dark/light mode support

## Data Sources

Charts automatically pull data from:
- `adminStore.users`: User role and verification data
- `adminStore.userStats`: Chat and conversation statistics  
- `adminStore.allRecentActivities`: Activity trends and patterns

The charts update in real-time as admin data changes through the SSE connection.
