export const formatTag = (tag) => {
  if (!tag) return '';
  return tag.split('/').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join('/');
};

export const formatTags = (tags) => {
  if (!tags) return '';
  return tags.split(', ').map(formatTag).join(', ');
};