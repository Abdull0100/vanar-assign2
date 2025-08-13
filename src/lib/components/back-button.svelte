<script lang="ts">
    import { ArrowLeft } from "lucide-svelte";

    // Required prop: no default value
    export let href: string;
    export let label: string = "Back";
</script>

<a
    href={href}
    class="absolute top-4 left-4 text-muted-foreground hover:text-foreground flex items-center gap-1"
>
    <ArrowLeft class="h-5 w-5" />
    <span class="sr-only">{label}</span>
</a>
