"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts";
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

export interface RawSession {
    date: string;
    durationMinutes: number;
    subjectId: string;
}

type Period = "7D" | "30D" | "90D";

const PERIOD_LABELS: Record<Period, string> = {
    "7D": "Last 7 Days",
    "30D": "Last 30 Days",
    "90D": "Last 90 Days",
};

const PERIOD_DAYS: Record<Period, number> = { "7D": 7, "30D": 30, "90D": 90 };

const chartConfig = {
    minutes: { label: "Minutes", color: "#2563eb" },
} satisfies ChartConfig;

function toYMD(d: Date): string {
    return d.toISOString().split("T")[0];
}

function lastSaturday(from: Date): Date {
    const d = new Date(from);
    // 0=Sun,1=Mon,...,6=Sat → distance to last Saturday
    const diff = (d.getDay() + 1) % 7;
    d.setDate(d.getDate() - diff);
    return d;
}

function buildDateRange(period: Period): string[] {
    const days = PERIOD_DAYS[period];
    const today = new Date();

    if (period === "7D") {
        const start = lastSaturday(today);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return toYMD(d);
        });
    }

    return Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (days - 1 - i));
        return toYMD(d);
    });
}

interface Props {
    sessions: RawSession[];
}

export function StudyActivityChart({ sessions }: Props) {
    const [period, setPeriod] = useState<Period>("7D");

    const data = useMemo(() => {
        const dateRange = buildDateRange(period);
        return dateRange.map((date) => ({
            date,
            minutes: sessions
                .filter((s) => s.date === date)
                .reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
        }));
    }, [sessions, period]);

    const hasData = data.some((d) => d.minutes > 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle>Study Activity</CardTitle>
                        <CardDescription>{PERIOD_LABELS[period]}</CardDescription>
                    </div>
                    <div className="flex rounded-md border overflow-hidden shrink-0 w-full sm:w-auto">
                        {(["7D", "30D", "90D"] as Period[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={
                                    `flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium transition-colors ` +
                                    (period === p
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted")
                                }
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {!hasData ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        No sessions in this period yet.
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                        <AreaChart
                            data={data}
                            margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/50" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={period === "7D" ? 0 : 28}
                                tickFormatter={(v) =>
                                    new Date(v).toLocaleDateString("en-US", {
                                        weekday: period === "7D" ? "short" : undefined,
                                        month: period !== "7D" ? "short" : undefined,
                                        day: "numeric",
                                    })
                                }
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                domain={[0, "auto"]}
                                tickFormatter={(v) => `${v}m`}
                            />
                            <ReferenceLine y={0} stroke="transparent" />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Area
                                dataKey="minutes"
                                type="monotone"
                                fill="url(#minutesGradient)"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{ fill: "#2563eb", strokeWidth: 0, r: 3 }}
                                activeDot={{ r: 5 }}
                                isAnimationActive={true}
                                baseValue={0}
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
