import { useEffect, useState } from "react";
import {
  clearRecoveryRecords,
  downloadRecoveryRecord,
  loadRecoveryRecords,
  removeRecoveryRecord,
  STORAGE_RECOVERY_EVENT,
  type RecoveryRecord,
} from "../../core/storage/safeStorage";

export function StorageRecoveryCenter() {
  const [records, setRecords] = useState<RecoveryRecord[]>(() => loadRecoveryRecords());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setRecords(loadRecoveryRecords());
    window.addEventListener(STORAGE_RECOVERY_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(STORAGE_RECOVERY_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (records.length === 0) return null;

  return (
    <div className="recovery-center">
      <button type="button" className="recovery-alert" onClick={() => setIsOpen(true)}>
        <strong>{records.length} bozuk kayÄ±t gÃ¼venli alana taÅŸÄ±ndÄ±</strong>
        <span>Ä°ncele ve ham veriyi indir</span>
      </button>

      {isOpen ? (
        <div className="recovery-modal-backdrop" role="presentation">
          <section className="recovery-modal" role="dialog" aria-modal="true" aria-label="Veri kurtarma merkezi">
            <div className="recovery-modal-head">
              <div>
                <span className="eyebrow">Veri Kurtarma</span>
                <h2>Bozuk kayÄ±tlar karantinada</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)}>Kapat</button>
            </div>
            <p>
              Bu kayÄ±tlar uygulamanÄ±n aÃ§Ä±lmasÄ±nÄ± engellemesin diye asÄ±l anahtarlarÄ±ndan
              kaldÄ±rÄ±ldÄ±. Ham iÃ§eriÄŸi indirip inceleyebilir veya artÄ±k gerekmiyorsa silebilirsin.
            </p>
            <div className="recovery-record-list">
              {records.map((record) => (
                <article key={record.id} className="recovery-record-card">
                  <div>
                    <strong>{record.storageKey}</strong>
                    <span>{new Date(record.createdAt).toLocaleString("tr-TR")}</span>
                    <small>{record.reason}</small>
                  </div>
                  <div className="recovery-record-actions">
                    <button type="button" onClick={() => downloadRecoveryRecord(record)}>Ham veriyi indir</button>
                    <button type="button" className="danger-action" onClick={() => removeRecoveryRecord(record.id)}>KaydÄ± sil</button>
                  </div>
                </article>
              ))}
            </div>
            <button type="button" className="danger-action recovery-clear" onClick={clearRecoveryRecords}>
              TÃ¼m kurtarma kayÄ±tlarÄ±nÄ± temizle
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}

