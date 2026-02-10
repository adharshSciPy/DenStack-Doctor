// src/components/CBCTViewerPage.tsx
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import MinimalCBCTViewer from "./nifti/Niftiviewer";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

const CBCTViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fileUrl = searchParams.get("fileUrl") || undefined;
  const fileName = searchParams.get("fileName") || "CBCT Scan";

  if (!fileUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="mb-4 text-lg text-gray-700">No scan URL provided.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex-1 p-4">
        <MinimalCBCTViewer
          fileUrl={fileUrl}
          fileName={fileName}
          onError={(msg: string) => {
            console.error("CBCT viewer error:", msg);
          }}
        />
      </div>
    </div>
  );
};

export default CBCTViewerPage;