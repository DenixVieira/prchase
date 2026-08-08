import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { organizationsService } from "@/services/organizations.service";
import { ticketsService } from "@/services/tickets.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { downloadBlob } from "@/lib/utils";
import { Attachment } from "@/types";
import { MAX_RANGE_DAYS } from "./constants";
import { FilterFields } from "./FilterFields";
import { ConsultTab, ConsultSortKey } from "./ConsultTab";
import { ExportTab } from "./ExportTab";

export default function InvoiceExportPage() {
  const { showToast } = useToast();
  const [organizationId, setOrganizationId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [sortKey, setSortKey] = useState<ConsultSortKey>("dueDate");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  // Só lista organizações que o usuário logado pode acessar — a mesma regra
  // usada ao criar uma solicitação de compra.
  const { data: organizations } = useQuery({
    queryKey: ["organizations", "my-accessible"],
    queryFn: () => organizationsService.myAccessible(),
  });

  const filtersReady = Boolean(organizationId && startDate && endDate);

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["organizations", organizationId, "invoices", startDate, endDate],
    queryFn: () => organizationsService.listInvoices(organizationId, startDate, endDate),
    enabled: filtersReady,
  });

  const handleDownload = async () => {
    if (!filtersReady || isDownloading) return;
    setIsDownloading(true);
    try {
      const blob = await organizationsService.exportInvoicesZip(organizationId, startDate, endDate);
      const organizationName = organizations?.find((o) => o.id === organizationId)?.name ?? "organizacao";
      downloadBlob(blob, `${organizationName}-notas-fiscais-${startDate}-a-${endDate}.zip`);
      showToast({ title: "ZIP gerado com sucesso", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao gerar o ZIP", description: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadNote = async (attachment: Attachment) => {
    if (!attachment.ticket) return;
    try {
      const blob = await ticketsService.downloadAttachment(attachment.ticket.id, attachment.id);
      downloadBlob(blob, attachment.originalName);
    } catch (error) {
      showToast({ title: "Erro ao baixar nota", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <Breadcrumb items={[{ label: "Notas Fiscais" }]} />

      <Card>
        <CardHeader><CardTitle className="text-base">Notas Fiscais</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione a organização e o período desejado (máximo de {MAX_RANGE_DAYS} dias) para consultar ou
            baixar as notas fiscais anexadas aos tickets no intervalo escolhido.
          </p>

          <FilterFields
            organizationId={organizationId}
            onOrganizationIdChange={setOrganizationId}
            organizations={organizations}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
          />

          <Tabs defaultValue="consultar">
            <TabsList>
              <TabsTrigger value="consultar">Consultar</TabsTrigger>
              <TabsTrigger value="exportar">Exportar</TabsTrigger>
            </TabsList>

            <TabsContent value="consultar">
              <ConsultTab
                filtersReady={filtersReady}
                isLoadingInvoices={isLoadingInvoices}
                invoices={invoices}
                onDownloadNote={handleDownloadNote}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSortChange={(nextSortKey, nextSortOrder) => { setSortKey(nextSortKey); setSortOrder(nextSortOrder); }}
              />
            </TabsContent>

            <TabsContent value="exportar">
              <ExportTab filtersReady={filtersReady} isDownloading={isDownloading} onDownload={handleDownload} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
