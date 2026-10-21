import React from 'react';
import { UploadCloud, CheckCircle } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { Caption } from '@components/ui/typography';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { NativeSelect } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { HStack } from '@components/ui/stack';
import { translate } from '@common/i18n/translator';
import { useSettings } from '@common/hooks/SettingsContext';
import { useLocale } from '@common/hooks/LocaleProvider';

export function ApiSyncSettings() {
  const { locale, customTranslations } = useLocale();
  const {
    logToApi,
    setLogToApi,
    apiToken,
    setApiToken,
    apiUrl,
    setApiUrl,
    apiMethod,
    setApiMethod,
    apiHeaders,
    setApiHeaders,
  } = useSettings();

  return (
    <CollapsibleCard
      title={translate(locale, 'settings', 'SendLogsToApi', customTranslations)}
      icon={UploadCloud}
      iconColor="text-indigo-500"
      defaultExpanded={false}
      headerTestId="api-push-collapse-header"
    >
      <Caption variant="muted">
        {translate(locale, 'settings', 'WebhookDesc', customTranslations)}
      </Caption>

      <Label className="flex items-center gap-2 cursor-pointer w-fit mt-2 font-normal">
        <Checkbox
          checked={logToApi}
          onCheckedChange={(checked) => setLogToApi(!!checked)}
          data-testid="api-push-toggle"
        />
        <span className="text-xs font-semibold text-foreground">
          {translate(locale, 'settings', 'SendLogsToApi', customTranslations)}
        </span>
      </Label>

      {logToApi && (
        <div className="flex flex-col gap-3 mt-4 pl-6 border-l-2 border-indigo-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Label className="text-xs w-20 font-mono font-bold text-foreground">
              {translate(locale, 'settings', 'ApiAddress', customTranslations)}
            </Label>
            <Input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              data-testid="api-url-input"
              placeholder="https://moj-serwer.pl/api/oxyflow-logs"
              className="flex-1 rounded-xl text-xs p-3 font-mono transition-all bg-card border-border text-foreground"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Label className="text-xs w-20 font-mono font-bold text-foreground">
              {translate(locale, 'settings', 'BearerAuthTitle', customTranslations)}
            </Label>
            <Input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              data-testid="api-token-input"
              placeholder="eyJh..."
              className="flex-1 rounded-xl text-xs p-3 font-mono transition-all bg-card border-border text-foreground"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Label className="text-xs w-20 font-mono font-bold text-foreground">
              {translate(locale, 'settings', 'ApiMethod', customTranslations)}
            </Label>
            <NativeSelect
              value={apiMethod}
              onChange={(e) => setApiMethod(e.target.value as 'POST' | 'PUT')}
              className="flex-1 rounded-xl text-xs p-3 font-mono transition-all bg-card border-border text-foreground"
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <Label className="text-xs font-mono font-bold text-foreground">
              {translate(locale, 'settings', 'ApiHeaders', customTranslations)}
            </Label>
            <Caption>{translate(locale, 'settings', 'ApiHeadersDesc', customTranslations)}</Caption>
            <Textarea
              value={apiHeaders}
              onChange={(e) => setApiHeaders(e.target.value)}
              placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
              rows={4}
              className="w-full rounded-xl text-xs p-3 font-mono transition-all bg-card border-border text-foreground"
            />
          </div>

          <HStack gap="xs" className="mt-2 text-indigo-500">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <Caption size="2xs" weight="bold" className="text-indigo-500 font-mono">
              {translate(locale, 'common', 'ErrSuccess', customTranslations)}!
            </Caption>
          </HStack>
        </div>
      )}
    </CollapsibleCard>
  );
}

export default ApiSyncSettings;
