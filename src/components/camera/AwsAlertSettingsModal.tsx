import React, { useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle,
  AlertTriangle,
  Info,
  Layers,
  Mail,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useCameraStore } from '../../stores/useCameraStore';

interface AwsAlertSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const AwsAlertSettingsModal: React.FC<AwsAlertSettingsModalProps> = ({
  open,
  onClose,
}) => {
  const { pipelineStatus, loadAlertPipelineStatus } = useCameraStore();

  useEffect(() => {
    if (open) {
      loadAlertPipelineStatus();
    }
  }, [open]);

  if (!open) return null;

  const isConfigured = pipelineStatus?.pipelineStatus === 'ACTIVE_END_TO_END';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0C101D] border border-white/[0.1] rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#080C16] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AWS SQS / SNS Alert Pipeline</h2>
              <p className="text-xs font-mono text-zinc-400">
                Cloud Incident Broadcast & Email Notification Status
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAlertPipelineStatus()}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Ribbon */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isConfigured
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            {isConfigured ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-xs font-mono uppercase tracking-wider">
                {pipelineStatus?.pipelineStatus === 'ACTIVE_END_TO_END'
                  ? 'AWS Pipeline Active: End-to-End Delivery'
                  : pipelineStatus?.pipelineStatus === 'SQS_ONLY_SNS_UNCONFIGURED'
                  ? 'SQS Queue Ready · SNS Topic Pending'
                  : 'Local Incident Fallback Active (AWS Unconfigured)'}
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                {isConfigured
                  ? 'Camera integrity incidents are buffered through Amazon SQS and broadcast via Amazon SNS email subscribers.'
                  : 'Incidents are captured locally in the persistent H2 database with high-resolution timestamps. Cloud SQS/SNS dispatch is disabled or unconfigured.'}
              </p>
            </div>
          </div>

          {/* Configuration Parameters Table */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Configured Cloud Parameters
            </div>

            <div className="bg-[#080C16] border border-white/[0.06] rounded-xl divide-y divide-white/[0.06] text-xs font-mono">
              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Cloud className="w-3.5 h-3.5 text-zinc-500" />
                  AWS Region
                </span>
                <span className="text-white font-bold">{pipelineStatus?.awsRegion || 'us-east-1'}</span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  SQS Queue URL
                </span>
                <span className="text-zinc-300">
                  {pipelineStatus?.sqsQueueMasked || 'NOT_CONFIGURED'}
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-orange-400" />
                  SNS Topic ARN
                </span>
                <span className="text-zinc-300">
                  {pipelineStatus?.snsTopicMasked || 'NOT_CONFIGURED'}
                </span>
              </div>
            </div>
          </div>

          {/* Transparent AWS Academy Learner Lab Notice */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Info className="w-4 h-4 text-cyan-400" />
              AWS Academy Learner Lab Environment Notice
            </div>
            <p className="text-[11px] leading-relaxed">
              AWS Learner Labs utilize temporary session credentials (<code className="text-zinc-300">AWS_SESSION_TOKEN</code>) with restricted IAM permissions. BlockVault uses the standard AWS SDK credential chain:
            </p>
            <ul className="text-[11px] list-disc list-inside space-y-1 text-zinc-300">
              <li>Automatic discovery of Environment Variables & EC2 Instance Profiles</li>
              <li>Graceful fallback prevents system crashes when lab credentials expire</li>
              <li>All incidents, health transitions, and evidence hashes remain fully preserved in file-based H2 storage</li>
            </ul>
          </div>

          {/* Close button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono bg-white/[0.06] text-white hover:bg-white/[0.1] transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
