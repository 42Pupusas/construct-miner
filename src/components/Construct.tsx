import { UnpublishedConstructType } from "../types/Construct";

type UnpublishedConstructProps = {
  construct: UnpublishedConstructType
}

export const UnpublishedConstruct = ({ construct }: UnpublishedConstructProps) => {


  return (
    <div className="construct" key={construct.id}>
      <h2>{ construct.workCompleted }pow</h2>
      <small>{ construct.id }</small>
    </div>
  )
}