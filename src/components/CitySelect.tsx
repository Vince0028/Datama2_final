import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { PH_CITIES_SORTED } from "@/data/ph-cities";

interface CitySelectProps {
    value: string;
    onChange: (city: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function CitySelect({ value, onChange, placeholder = "Select city...", disabled }: CitySelectProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCities = PH_CITIES_SORTED.filter(city =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) setSearchTerm(""); // Reset search when closed
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        !value && "text-muted-foreground"
                    )}
                >
                    {value || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search city..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <CommandList>
                        {filteredCities.length === 0 && <CommandEmpty>No city found.</CommandEmpty>}
                        <CommandGroup>
                            {filteredCities.map((city) => (
                                <CommandItem
                                    key={city}
                                    value={city}
                                    onSelect={() => {
                                        onChange(city);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === city ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {city}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
