"use client";

import { useMemo, useState } from 'react';
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
  leagueDivision: z.string({ required_error: 'Please select a league division.' }),
  nationalsDivision: z.string({ required_error: 'Please select a nationals division.' }),
  logo: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

type CreateClubDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export const CreateClubDialog = ({ isOpen, onOpenChange }: CreateClubDialogProps) => {
  const { teams, startNewCustomClub } = useTeam();

  const divisions = useMemo(() => {
    if (!teams) return { leagueDivs: [], nationalsDivs: [] };
    const leagueDivs = [...new Set(teams.map(t => t.leagueDivision))].sort();
    const nationalsDivs = [...new Set(teams.map(t => t.nationalsDivision))].sort();
    return { leagueDivs, nationalsDivs };
  }, [teams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      teamName: '',
      logo: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!startNewCustomClub) {
        toast.error("Initialization error", { description: "The function to create a club is not available."});
        return;
    }
    // Ensure all required fields are strings, even if Zod/RHF makes them optional in inference
    const clubData = {
      organizationName: values.organizationName || '',
      teamName: values.teamName || '',
      leagueDivision: values.leagueDivision || '',
      nationalsDivision: values.nationalsDivision || '',
      logo: values.logo || '', // Already handled
    };
    startNewCustomClub(clubData);
    onOpenChange(false);
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
              name="leagueDivision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>League Division</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a league" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {divisions.leagueDivs.map(div => (
                        <SelectItem key={div} value={div}>{div}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nationalsDivision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nationals Division</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a nationals tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {divisions.nationalsDivs.map(div => (
                        <SelectItem key={div} value={div}>{div}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create Club</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};