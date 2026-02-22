import { useForm } from "react-hook-form";
import {
  useIngredients,
  useCreateIngredient,
  useDeleteIngredient,
} from "../hooks/use-ingredients";

export default function Ingredients() {
  const { data: ingredients = [] } = useIngredients();
  const createIngredient = useCreateIngredient();
  const deleteIngredient = useDeleteIngredient();

  const { register, handleSubmit, reset } = useForm<{ name: string }>();

  const onSubmit = (data: { name: string }) => {
    createIngredient.mutate(data);
    reset();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Ingredients</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("name", { required: true })}
          placeholder="Ingredient name"
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {ingredients.map((ingredient) => (
          <li key={ingredient.id}>
            {ingredient.name}
            <button onClick={() => deleteIngredient.mutate(ingredient.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}