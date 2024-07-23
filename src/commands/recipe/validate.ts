import yaml from "js-yaml";

import { BaseCommand } from "./_base.js";
import { validateRecipe } from "../../utils/validate-recipe.js";

export default class RecipeValidate extends BaseCommand<typeof RecipeValidate> {
  static override summary = "Process data using recipes";

  public async run(): Promise<void> {
    await validateRecipe(yaml.load(this.recipe) as object, this.conf);
    this.log("✅ Validation complete");
  }
}
