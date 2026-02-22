"use client";

import { Pie, PieChart, Cell, Legend } from "recharts";
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

export interface TimePerSubjectDataPoint {
    subject: string;
    minutes: number;
}

const COLORS = ["#2563eb", "#60a5fa", "#34d399", "#f59e0b", "#a78bfa", "#f472b6"];

const chartConfig = {
    minutes: { label: "Minutes" },
} satisfies ChartConfig;

interface Props {
    data: TimePerSubjectDataPoint[];
}

export function SubjectTimeChart({ data }: Props) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Time Allocation</CardTitle>
                <CardDescription>Total minutes studied per subject.</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        No sessions yet.
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
                        <PieChart>
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        hideLabel
                                        formatter={(value) => [`${value} min`, ""]}
                                    />
                                }
                            />
                            {/* Removed innerRadius, so it's a solid pie chart */}
                            <Pie
                                data={data}
                                dataKey="minutes"
                                nameKey="subject"
                                outerRadius="80%"
                                paddingAngle={2}
                                strokeWidth={0}
                            >
                                {data.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => (
                                    <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{value}</span>
                                )}
                            />
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
