"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTeam } from '@/context/TeamContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const formSchema = z.object({
  organizationName: z.string().min(3, { message: 'Organization name must be at least 3 characters.' }),
  teamName: z.string().min(3, { message: 'Team name must be at least 3 characters.' }),
  region: z.string({ required_error: 'Please select a region.' }),
  logo: z.instanceof(FileList).optional(),
});

type CreateClubDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export const CreateClubDialog = ({ isOpen, onOpenChange }: CreateClubDialogProps) => {
  const { startNewCustomClub } = useTeam();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      teamName: '',
    },
  });

  const { register } = form;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!startNewCustomClub) {
        toast.error("Initialization error", { description: "The function to create a club is not available."});
        return;
    }

    let logoUrl = '';
    if (values.logo && values.logo.length > 0) {
        const file = values.logo[0];
        try {
            logoUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });
        } catch (error) {
            toast.error("Logo Upload Failed", { description: "Could not read the selected logo file." });
            return;
        }
    }

    const leagueDivision = `Non Checking 3 - ${values.region}`;
    const nationalsDivision = 'Non-Checking 3';

    startNewCustomClub({
      organizationName: values.organizationName,
      teamName: values.teamName,
      leagueDivision,
      nationalsDivision,
      logo: logoUrl,
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Club</DialogTitle>
          <DialogDescription>
            Build your own university hockey organization from the ground up.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Northumbria University" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Northumbria Kings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="North">North</SelectItem>
                      <SelectItem value="South">South</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Logo (Optional, PNG only)</FormLabel>
              <FormControl>
                <Input type="file" accept="image/png" {...register("logo")} />
              </FormControl>
              <FormMessage />
            </FormItem>
            <DialogFooter>
              <Button type="submit">Create Club</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};