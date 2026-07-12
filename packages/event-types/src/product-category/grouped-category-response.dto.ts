export class GroupedSubcategoryDto {
  id: number;
  subcategoryName: string | null;
}

export class GroupedCategoryResponseDto {
  categoryName: string;
  subcategories: GroupedSubcategoryDto[];
}
