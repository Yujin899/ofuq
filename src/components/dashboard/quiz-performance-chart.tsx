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

export interface QuizPerformanceDataPoint {
    subject: string;
    score: number;
}

const COLORS = ["#2563eb", "#60a5fa", "#34d399", "#f59e0b", "#a78bfa"];

const chartConfig = {
    score: { label: "Avg Score %", color: "#2563eb" },
} satisfies ChartConfig;

interface Props {
    data: QuizPerformanceDataPoint[];
}

export function QuizPerformanceChart({ data }: Props) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Quiz Performance</CardTitle>
                <CardDescription>Average quiz score across subjects.</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        No quiz data yet.
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
                            <XAxis type="number" hide domain={[0, 100]} />
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
                                dataKey="score"
                                layout="vertical"
                                radius={4}
                                barSize={28}
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
