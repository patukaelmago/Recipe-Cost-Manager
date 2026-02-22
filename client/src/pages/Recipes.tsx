import { useForm } from "react-hook-form";
import { useRecipes, useCreateRecipe, useDeleteRecipe } from "../hooks/use-recipes";

export default function Recipes() {
  const { data: recipes = [] } = useRecipes();
  const createRecipe = useCreateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const { register, handleSubmit, reset } = useForm<{ name: string }>();

  const onSubmit = (data: { name: string }) => {
    createRecipe.mutate(data);
    reset();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Recipes</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("name", { required: true })}
          placeholder="Recipe name"
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            {recipe.name}
            <button onClick={() => deleteRecipe.mutate(recipe.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}