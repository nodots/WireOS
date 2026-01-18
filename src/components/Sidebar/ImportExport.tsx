import { useRef, useState } from 'react';
import { useBosData } from '../../hooks/useBosData';
import { validateBosFeatureCollection } from '../../utils/geojson';
import type { BosFeatureCollection } from '../../types/bos';

export function ImportExport() {
  const { exportData, importData } = useBosData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);

    try {
      const text = await file.text();
      let data: unknown;

      try {
        data = JSON.parse(text);
      } catch {
        setImportError('Invalid JSON file');
        return;
      }

      if (!validateBosFeatureCollection(data)) {
        setImportError(
          'Invalid GeoJSON format. Must be a valid BOS FeatureCollection.'
        );
        return;
      }

      importData(data as BosFeatureCollection);
    } catch {
      setImportError('Failed to read file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="import-export">
      <h3>Data</h3>

      <div className="button-group">
        <button className="btn" onClick={handleExport}>
          Export GeoJSON
        </button>
        <button className="btn" onClick={handleImportClick}>
          Import GeoJSON
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {importError && <div className="error-message">{importError}</div>}

      <p className="help-text">
        Export your data, commit to Git, and share with collaborators.
      </p>
    </div>
  );
}
