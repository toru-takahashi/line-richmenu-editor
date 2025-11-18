export type RichMenuSize = { width: number; height: number }

export type LineAction =
  | { type: 'uri'; uri: string }
  | { type: 'message'; text: string }
  | { type: 'postback'; data: string; displayText?: string; label?: string; display?: 'none' | 'close' | 'open' | 'keyboard' | 'voice' }
  | { type: 'datetimepicker'; data: string; mode: 'date' | 'time' | 'datetime'; initial?: string; max?: string; min?: string }
  | { type: 'richmenuswitch'; richMenuAliasId: string; data?: string }

export type Area = {
  id: string
  bounds: { x: number; y: number; width: number; height: number }
  action: LineAction
}

export type RichMenu = {
  size: RichMenuSize
  selected: boolean
  name: string
  chatBarText: string
  areas: Array<{ bounds: { x: number; y: number; width: number; height: number }; action: LineAction }>
  // optional extension to keep background image url
  imageUrl?: string
}
