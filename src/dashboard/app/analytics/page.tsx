"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { useStatusCounts, useDepartmentBudgets, useProposals } from "@/hooks/use-proposals";
import { ThreeCanvasWrapper } from "@/components/charts/three-canvas-wrapper";
import { StatusBarChart3D } from "@/components/charts/status-bar-chart-3d";
import { BudgetPie3D } from "@/components/charts/budget-pie-3d";
import { TimelineChart } from "@/components/charts/timeline-chart";
import { OrbitControls } from "@react-three/drei";

export default function AnalyticsPage() {
  const { data: statusCounts } = useStatusCounts();
  const { data: departmentBudgets } = useDepartmentBudgets();
  const { data: proposals } = useProposals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-default-500">
          3D visualizations of grant portfolio metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Proposals by Status (3D)
            </h2>
          </CardHeader>
          <CardBody>
            {statusCounts ? (
              <ThreeCanvasWrapper
                height="350px"
                camera={{ position: [0, 4, 10], fov: 45 }}
              >
                <StatusBarChart3D data={statusCounts} />
                <OrbitControls
                  enablePan={false}
                  minDistance={5}
                  maxDistance={20}
                />
              </ThreeCanvasWrapper>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-default-400">
                Loading chart data...
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Budget by Department (3D)
            </h2>
          </CardHeader>
          <CardBody>
            {departmentBudgets ? (
              <ThreeCanvasWrapper
                height="350px"
                camera={{ position: [0, 5, 5], fov: 45 }}
              >
                <BudgetPie3D data={departmentBudgets} />
                <OrbitControls
                  enablePan={false}
                  minDistance={4}
                  maxDistance={15}
                />
              </ThreeCanvasWrapper>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-default-400">
                Loading chart data...
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Proposal Timeline (3D)
          </h2>
        </CardHeader>
        <CardBody>
          {proposals ? (
            <ThreeCanvasWrapper
              height="300px"
              camera={{ position: [0, 4, 8], fov: 50 }}
            >
              <TimelineChart proposals={proposals} />
              <OrbitControls
                enablePan={false}
                minDistance={5}
                maxDistance={20}
              />
            </ThreeCanvasWrapper>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-default-400">
              Loading chart data...
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
