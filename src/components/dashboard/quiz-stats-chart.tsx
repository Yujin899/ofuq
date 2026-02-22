"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

export interface QuizStatDataPoint {
    subject: string;
    sessions: number;
}

const COLORS = ["#2563eb", "#60a5fa", "#34d399", "#f59e0b", "#a78bfa"];

const chartConfig = {
    sessions: { label: "Sessions", color: "#2563eb" },
} satisfies ChartConfig;

interface Props {
    data: QuizStatDataPoint[];
}

export function QuizStatsChart({ data }: Props) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Study Sessions</CardTitle>
                <CardDescription>Number of sessions completed per subject.</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        No sessions yet.
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="w-full" style={{ height: Math.max(250, data.length * 48) }}>
                        <BarChart
                            accessibilityLayer
                            data={data}
                            layout="vertical"
                            margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                        >
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/40" />
                            <XAxis type="number" hide allowDecimals={false} />
                            <YAxis
                                dataKey="subject"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={100}
                                tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Bar
                                dataKey="sessions"
                                layout="vertical"
                                radius={4}
                                barSize={28}
                                // Renders an empty "track" behind the bar
                                background={{ fill: "hsl(var(--muted))", radius: 4 }}
                            >
                                {data.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
