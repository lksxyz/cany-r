import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import { Label } from "@workspace/ui/components/label"
import { Progress } from "@workspace/ui/components/progress"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"
import { Toggle } from "@workspace/ui/components/toggle"

export default function ComponentsPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Components</h1>
        <p className="text-sm text-muted-foreground">
          Reference for shadcn/ui primitives available in{" "}
          <KbdGroup>
            <Kbd>@workspace/ui/components</Kbd>
          </KbdGroup>
          .
        </p>
      </header>

      <Section title="Badge">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          Sizes:
          <Button size="sm">sm</Button>
          <Button>default</Button>
          <Button size="lg">lg</Button>
        </div>
        <ButtonGroup>
          <Button variant="outline">Left</Button>
          <Button variant="outline">Middle</Button>
          <Button variant="outline">Right</Button>
        </ButtonGroup>
      </Section>

      <Section title="Toggle">
        <div className="flex flex-wrap items-center gap-2">
          <Toggle>Default</Toggle>
          <Toggle variant="outline">Outline</Toggle>
        </div>
      </Section>

      <Section title="Card">
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content.</p>
          </CardContent>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Alert">
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>This is an inline alert.</AlertDescription>
        </Alert>
      </Section>

      <Section title="Avatar">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>0V</AvatarFallback>
          </Avatar>
        </div>
      </Section>

      <Section title="Breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Components</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      <Section title="Form">
        <div className="grid max-w-sm gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Ada Lovelace" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" placeholder="Tell us about yourself" />
          </div>
        </div>
      </Section>

      <Section title="Checkbox">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Checkbox defaultSelected /> Accept terms
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Checkbox /> Subscribe to updates
          </div>
        </div>
      </Section>

      <Section title="Switch">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Switch defaultSelected /> Airplane mode
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Switch /> Wi-Fi
          </div>
        </div>
      </Section>

      <Section title="Radio Group">
        <RadioGroup defaultValue="comfortable" className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="default" /> Default
          </div>
          <div className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="comfortable" /> Comfortable
          </div>
          <div className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="compact" /> Compact
          </div>
        </RadioGroup>
      </Section>

      <Section title="Slider">
        <Slider
          defaultValue={[50]}
          minValue={0}
          maxValue={100}
          step={1}
          className="max-w-sm"
        />
      </Section>

      <Section title="Progress">
        <Progress value={66} className="max-w-sm" />
      </Section>

      <Section title="Skeleton">
        <div className="flex w-full max-w-sm items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Section>

      <Section title="Separator">
        <div className="max-w-sm space-y-3">
          <p>Section one</p>
          <Separator />
          <p>Section two</p>
        </div>
      </Section>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}
