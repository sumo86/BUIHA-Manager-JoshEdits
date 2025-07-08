import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Player } from "@/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  jerseyNumber: z.coerce.number().int().min(0).max(99),
  nationality: z.string().min(2, { message: "Nationality must be at least 2 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

interface PlayerEditFormProps {
  player: Player;
  onSave: (updatedPlayer: Partial<Player>) => void;
  allUsedJerseyNumbers: number[];
}

export const PlayerEditForm = ({ player, onSave, allUsedJerseyNumbers }: PlayerEditFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: player.name,
      jerseyNumber: player.jerseyNumber,
      nationality: player.nationality,
    },
  });

  const onSubmit = (values: FormValues) => {
    onSave({
      id: player.id,
      name: values.name,
      jerseyNumber: values.jerseyNumber,
      nationality: values.nationality,
    });
    toast.success(`${player.name}'s details have been updated.`);
  };

  const availableJerseyNumbers = Array.from({ length: 99 }, (_, i) => i + 1)
    .filter(num => !allUsedJerseyNumbers.includes(num) || num === player.jerseyNumber);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-md">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jerseyNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jersey Number</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a jersey number" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableJerseyNumbers.map(num => (
                    <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nationality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nationality</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
};