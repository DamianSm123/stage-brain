import { useCallback, useState } from "react";
import type { OperatorTag } from "@/entities/operator-tag";
import { useShowStore } from "@/entities/show";
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

const PRESET_TAGS = [
  { tag: "Peak", icon: "⚡" },
  { tag: "Low energy", icon: "↓" },
  { tag: "Tech issue", icon: "⚠" },
  { tag: "Improv", icon: "🎤" },
  { tag: "Great!", icon: "★" },
  { tag: "Przebudowa", icon: "🔧" },
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
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Quick Tags
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {PRESET_TAGS.map(({ tag, icon }) => (
          <Button
            key={tag}
            variant="outline"
            className={`min-h-[44px] text-sm transition-colors ${
              flashingTag === tag ? "bg-primary text-primary-foreground" : ""
            }`}
            onClick={() => handleTagClick(tag, icon)}
          >
            <span>{icon}</span>
            <span>{tag}</span>
          </Button>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <Button
          variant="outline"
          className={`min-h-[44px] w-full text-sm transition-colors ${
            flashingTag === "custom" ? "bg-primary text-primary-foreground" : ""
          }`}
          onClick={() => setDialogOpen(true)}
        >
          + Tag
        </Button>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom tag</DialogTitle>
            <DialogDescription>Wpisz tag (max {CUSTOM_TAG_MAX_LENGTH} znaków)</DialogDescription>
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
              placeholder="np. Świetna reakcja"
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
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags
            .slice()
            .reverse()
            .slice(0, 5)
            .map((t) => (
              <Badge key={t.id} variant="secondary" className="text-xs">
                {t.custom_text ? `${t.custom_text}` : t.tag}
              </Badge>
            ))}
          {tags.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 5}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
