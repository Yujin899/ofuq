"use client";

import {
    Label,
    PolarGrid,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

const chartConfig = {
    value: { label: "Progress" },
    achieved: { label: "Achieved", color: "#2563eb" },
} satisfies ChartConfig;

interface Props {
    achievedPercent: number;
    goalMinutes?: number;
    studiedMinutes: number;
}

export function DailyGoalChart({ achievedPercent, goalMinutes = 120, studiedMinutes }: Props) {
    const chartData = [
        { name: "Achieved", value: achievedPercent, fill: "#2563eb" },
        { name: "Remaining", value: 100 - achievedPercent, fill: "#e2e8f0" },
    ];

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Daily Study Goal</CardTitle>
                <CardDescription>
                    {studiedMinutes}m of {goalMinutes}m goal today
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
                    <RadialBarChart
                        data={chartData}
                        startAngle={90}
                        endAngle={450 * (achievedPercent / 100) + 90}
                        innerRadius={80}
                        outerRadius={110}
                    >
                        <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="first:fill-muted last:fill-background"
                            polarRadius={[86, 74]}
                        />
                        <RadialBar dataKey="value" background cornerRadius={10} />
                        <PolarRadiusAxis type="number" domain={[0, 100]} tick={false} axisLine={false}>
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-4xl font-bold">
                                                    {achievedPercent}%
                                                </tspan>
                                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                                                    Complete
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
