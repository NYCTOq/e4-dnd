import { useCallback, useEffect, useState } from "react";
import {
  clearRecoveryRecords,
  downloadRecoveryRecord,
  loadRecoveryRecords,
  removeRecoveryRecord,
  STORAGE_RECOVERY_EVENT,
  type RecoveryRecord,
} from "../../core/storage/safeStorage";
import { useDialogFocus } from "../accessibility/dialogFocus";

export function StorageRecoveryCenter() {
  const [records, setRecords] = useState<RecoveryRecord[]>(() => loadRecoveryRecords());
  const [isOpen, setIsOpen] = useState(false);
  const closeRecovery = useCallback(() => setIsOpen(false), []);
  const dialogRef = useDialogFocus(isOpen, closeRecovery);

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
        <strong>{records.length} bozuk kayıt güvenli alana taşındı</strong>
        <span>İncele ve ham veriyi indir</span>
      </button>

      {isOpen ? (
        <div className="recovery-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRecovery(); }}>
          <section ref={dialogRef} tabIndex={-1} data-dialog-id="storage-recovery" className="recovery-modal" role="dialog" aria-modal="true" aria-label="Veri kurtarma merkezi" onMouseDown={(event) => event.stopPropagation()}>
            <div className="recovery-modal-head">
              <div>
                <span className="eyebrow">Veri Kurtarma</span>
                <h2>Bozuk kayıtlar karantinada</h2>
              </div>
              <button type="button" onClick={closeRecovery}>Kapat</button>
            </div>
            <p>
              Bu kayıtlar uygulamanın açılmasını engellemesin diye asıl anahtarlarından
              kaldırıldı. Ham içeriği indirip inceleyebilir veya artık gerekmiyorsa silebilirsin.
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
                    <button type="button" className="danger-action" onClick={() => removeRecoveryRecord(record.id)}>Kaydı sil</button>
                  </div>
                </article>
              ))}
            </div>
            <button type="button" className="danger-action recovery-clear" onClick={clearRecoveryRecords}>
              Tüm kurtarma kayıtlarını temizle
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
