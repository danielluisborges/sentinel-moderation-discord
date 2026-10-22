import type {
  ChannelDTO,
  ChannelPositionUpdate,
  ChannelTreeDTO,
} from "../../../../../src/shared/dto.js";

export function lookup(
  tree: ChannelTreeDTO,
  id: string | undefined,
): ChannelDTO | undefined {
  if (!id) return undefined;
  for (const category of tree.categories) {
    if (category.id === id) return category;
    const found = category.children.find((child) => child.id === id);
    if (found) return found;
  }
  return tree.uncategorized.find((channel) => channel.id === id);
}

export function isCategory(tree: ChannelTreeDTO, id: string): boolean {
  return tree.categories.some((category) => category.id === id);
}

export function findBucket(tree: ChannelTreeDTO, id: string) {
  if (tree.uncategorized.some((channel) => channel.id === id))
    return { parentId: null };
  const category = tree.categories.find((item) =>
    item.children.some((channel) => channel.id === id),
  );
  return category ? { parentId: category.id } : null;
}

export function getBucket(tree: ChannelTreeDTO, parentId: string | null) {
  if (!parentId) return tree.uncategorized;
  return tree.categories.find((category) => category.id === parentId)!.children;
}

export function categoryName(tree: ChannelTreeDTO, parentId: string | null) {
  return (
    tree.categories.find((category) => category.id === parentId)?.name ??
    "Sem categoria"
  );
}

export function flattenChannels(tree: ChannelTreeDTO): ChannelDTO[] {
  const result: ChannelDTO[] = [];
  const visit = (channel: ChannelDTO) => {
    result.push(channel);
    channel.children.forEach(visit);
  };
  tree.categories.forEach(visit);
  tree.uncategorized.forEach(visit);
  return result;
}

export function toPositionUpdates(
  tree: ChannelTreeDTO,
): ChannelPositionUpdate[] {
  const ordered: ChannelDTO[] = [...tree.uncategorized];
  for (const category of tree.categories)
    ordered.push(category, ...category.children);
  return ordered.map((channel, position) => ({
    id: channel.id,
    position,
    parentId: channel.type === "category" ? null : channel.parentId,
  }));
}

export function moveChannel(
  tree: ChannelTreeDTO,
  activeId: string,
  overId: string,
): ChannelTreeDTO | null {
  if (activeId === overId) return null;
  if (isCategory(tree, activeId)) {
    if (!isCategory(tree, overId)) return null;
    const oldIndex = tree.categories.findIndex((item) => item.id === activeId);
    const newIndex = tree.categories.findIndex((item) => item.id === overId);
    if (oldIndex < 0 || newIndex < 0) return null;
    const categories = [...tree.categories];
    const [moving] = categories.splice(oldIndex, 1);
    categories.splice(newIndex, 0, moving!);
    return { ...tree, categories };
  }

  const sourceBucket = findBucket(tree, activeId);
  if (!sourceBucket) return null;
  let targetParentId: string | null;
  let insertAfterId: string | null = null;
  if (overId === "bucket:root") targetParentId = null;
  else if (overId.startsWith("bucket:"))
    targetParentId = overId.slice("bucket:".length);
  else if (isCategory(tree, overId)) targetParentId = overId;
  else {
    const targetBucket = findBucket(tree, overId);
    if (!targetBucket) return null;
    targetParentId = targetBucket.parentId;
    insertAfterId = overId;
  }

  const next = structuredClone(tree);
  const source = getBucket(next, sourceBucket.parentId);
  const [moving] = source.splice(
    source.findIndex((item) => item.id === activeId),
    1,
  );
  if (!moving) return null;
  const target = getBucket(next, targetParentId);
  const targetIndex = insertAfterId
    ? target.findIndex((item) => item.id === insertAfterId) + 1
    : target.length;
  target.splice(Math.max(0, targetIndex), 0, {
    ...moving,
    parentId: targetParentId,
  });
  return next;
}
