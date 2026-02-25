import { useCallback, useState } from "react";
import type { OperatorTag } from "@/entities/operator-tag";
import { useShowStore } from "@/entities/show";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

const PRESET_TAGS = [
  { tag: "Peak", icon: "\u26A1", label: "Szczyt energii" },
  { tag: "Low energy", icon: "\u2193", label: "Niska energia" },
  { tag: "Tech issue", icon: "\u26A0", label: "Problem techniczny" },
  { tag: "Improv", icon: "\uD83C\uDFA4", label: "Improwizacja" },
  { tag: "Great!", icon: "\u2605", label: "\u015Awietny moment" },
  { tag: "Przebudowa", icon: "\uD83D\uDD27", label: "Przebudowa sceny" },
] as const;

const FLASH_DURATION_MS = 500;
const CUSTOM_TAG_MAX_LENGTH = 30;

export function QuickTags() {
  const addTag = useShowStore((s) => s.addTag);
  const tags = useShowStore((s) => s.tags);

  const [flashingTag, setFlashingTag] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customText, setCustomText] = useState("");

  const handleTagClick = useCallback(
    (tagName: string, icon: string) => {
      const operatorTag: OperatorTag = {
        id: crypto.randomUUID(),
        tag: `${tagName} ${icon}`,
        timestamp: new Date().toISOString(),
      };
      addTag(operatorTag);

      setFlashingTag(tagName);
      setTimeout(() => setFlashingTag(null), FLASH_DURATION_MS);
    },
    [addTag],
  );

  const handleCustomTagSubmit = useCallback(() => {
    const trimmed = customText.trim();
    if (!trimmed) return;

    const operatorTag: OperatorTag = {
      id: crypto.randomUUID(),
      tag: "Custom",
      custom_text: trimmed,
      timestamp: new Date().toISOString(),
    };
    addTag(operatorTag);

    setCustomText("");
    setDialogOpen(false);

    setFlashingTag("custom");
    setTimeout(() => setFlashingTag(null), FLASH_DURATION_MS);
  }, [customText, addTag]);

  return (
    <div className="space-y-2">
      <TooltipProvider>
        <div className="flex items-center gap-1.5">
          {PRESET_TAGS.map(({ tag, icon, label }) => (
            <Tooltip key={tag}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "min-h-[44px] min-w-[44px] text-lg transition-colors",
                    flashingTag === tag && "bg-primary text-primary-foreground",
                  )}
                  onClick={() => handleTagClick(tag, icon)}
                >
                  {icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}

          <Button
            variant="outline"
            className={cn(
              "min-h-[44px] px-3 text-sm transition-colors",
              flashingTag === "custom" && "bg-primary text-primary-foreground",
            )}
            onClick={() => setDialogOpen(true)}
          >
            + Tag
          </Button>
        </div>
      </TooltipProvider>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>W\u0142asny tag</DialogTitle>
            <DialogDescription>
              Wpisz tag (max {CUSTOM_TAG_MAX_LENGTH} znak\u00F3w)
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCustomTagSubmit();
            }}
            className="flex gap-2"
          >
            <Input
              value={customText}
              onChange={(e) => setCustomText(e.target.value.slice(0, CUSTOM_TAG_MAX_LENGTH))}
              placeholder="np. \u015Awietna reakcja"
              maxLength={CUSTOM_TAG_MAX_LENGTH}
              autoFocus
              className="min-h-[44px]"
            />
            <Button type="submit" disabled={!customText.trim()} className="min-h-[44px]">
              Dodaj
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags
            .slice()
            .reverse()
            .slice(0, 3)
            .map((t) => (
              <Badge key={t.id} variant="secondary" className="text-xs">
                {t.custom_text ? t.custom_text : t.tag}
              </Badge>
            ))}
          {tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
