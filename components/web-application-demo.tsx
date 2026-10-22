"use client";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {SubscriptionDashboardDemo} from "@/components/subscription-dashboard-demo";
import {ProjectDashboardDemo} from "@/components/project-dashboard-demo";

export function WebApplicationDemo() {
  return <Tabs defaultValue="projects" className="web-app-models">
    <TabsList className="web-app-model-tabs" aria-label="Modelos de aplicativos web">
      <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
      <TabsTrigger value="projects">Gestão de projetos</TabsTrigger>
    </TabsList>
    <TabsContent value="subscriptions" className="web-app-model-panel"><SubscriptionDashboardDemo/></TabsContent>
    <TabsContent value="projects" className="web-app-model-panel"><ProjectDashboardDemo/></TabsContent>
  </Tabs>;
}
